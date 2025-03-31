import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as docker from "@pulumi/docker";

const config = new pulumi.Config();

// Get configuration values with sensible defaults
const discordToken = config.requireSecret("discordToken");
const clientId = config.require("clientId");
const guildId = config.require("guildId");

// VPC Setup
const vpc = new awsx.ec2.Vpc("rockstarbot-vpc", {
    numberOfAvailabilityZones: 2,
    subnets: [
        { type: "public", name: "public-subnet" },
        { type: "private", name: "private-subnet" },
    ],
});

// Security group for the Fargate service
const securityGroup = new aws.ec2.SecurityGroup("rockstarbot-sg", {
    vpcId: vpc.vpcId,
    description: "Security group for Rockstar Bot Fargate service",
    ingress: [
        { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
    ],
    egress: [
        { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] },
    ],
});

// Create an ECR repository
const repo = new awsx.ecr.Repository("rockstarbot-repo", {
    forceDelete: true,
});

// Build and push the Docker image to ECR
const image = new docker.Image("rockstarbot-image", {
    build: {
        context: "../../", // Path to the Dockerfile
    },
    imageName: repo.url,
    registry: {
        server: repo.url.apply(url => url.split("/")[0]),
        username: aws.ecr.getAuthorizationToken().then(token => token.userName),
        password: aws.ecr.getAuthorizationToken().then(token => token.password),
    },
});

// Create an ECS cluster
const cluster = new aws.ecs.Cluster("rockstarbot-cluster");

// Create a Fargate task definition
const taskDefinition = new aws.ecs.TaskDefinition("rockstarbot-task", {
    family: "rockstarbot",
    cpu: "256",
    memory: "512",
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    executionRoleArn: new aws.iam.Role("rockstarbot-execution-role", {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
            Service: "ecs-tasks.amazonaws.com",
        }),
    }).arn,
    taskRoleArn: new aws.iam.Role("rockstarbot-task-role", {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
            Service: "ecs-tasks.amazonaws.com",
        }),
    }).arn,
    containerDefinitions: pulumi.all([image.imageName]).apply(([imageName]) => JSON.stringify([{
        name: "rockstarbot",
        image: imageName,
        essential: true,
        environment: [
            { name: "DISCORD_TOKEN", value: discordToken },
            { name: "DISCORD_CLIENT_ID", value: clientId },
            { name: "GUILD_ID", value: guildId },
            { name: "NODE_ENV", value: "production" },
        ],
        logConfiguration: {
            logDriver: "awslogs",
            options: {
                "awslogs-group": "/ecs/rockstarbot",
                "awslogs-region": aws.config.region,
                "awslogs-stream-prefix": "ecs",
                "awslogs-create-group": "true",
            },
        },
    }])),
});

// Attach policies to the execution role
const executionRolePolicyAttachment = new aws.iam.RolePolicyAttachment("rockstarbot-execution-policy", {
    role: taskDefinition.executionRoleArn.apply(arn => arn.split("/")[1]),
    policyArn: aws.iam.ManagedPolicy.AmazonECSTaskExecutionRolePolicy,
});

// Create an ECS service
const service = new aws.ecs.Service("rockstarbot-service", {
    cluster: cluster.id,
    taskDefinition: taskDefinition.arn,
    desiredCount: 1,
    launchType: "FARGATE",
    networkConfiguration: {
        subnets: vpc.privateSubnetIds,
        securityGroups: [securityGroup.id],
        assignPublicIp: false,
    },
    // We don't need a load balancer for a Discord bot
});

// Create CloudWatch Logs group
const logGroup = new aws.cloudwatch.LogGroup("rockstarbot-logs", {
    name: "/ecs/rockstarbot",
    retentionInDays: 7,
});

// Export the service ARN
export const serviceArn = service.id;
export const logGroupName = logGroup.name;
