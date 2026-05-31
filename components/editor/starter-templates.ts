import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

function n(
  id: string,
  label: string,
  x: number,
  y: number,
  shape: NodeShape,
  colorIdx: number,
  width = 140,
  height = 50,
): CanvasNode {
  const c = NODE_COLORS[colorIdx % NODE_COLORS.length];
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: { label, shape, color: c.fill, textColor: c.text },
    style: { width, height },
  };
}

function e(id: string, source: string, target: string, label?: string): CanvasEdge {
  return { id, source, target, type: "canvasEdge", data: label ? { label } : {} };
}

const microservices: CanvasTemplate = {
  id: "microservices",
  name: "Microservices",
  description:
    "API gateway routing requests to domain services, each backed by its own database.",
  nodes: [
    n("api-gw", "API Gateway", 270, 0, "pill", 1, 160, 50),
    n("auth-svc", "Auth Service", 0, 130, "rectangle", 2, 140, 50),
    n("user-svc", "User Service", 180, 130, "rectangle", 6, 140, 50),
    n("order-svc", "Order Service", 360, 130, "rectangle", 3, 140, 50),
    n("notif-svc", "Notification", 540, 130, "rectangle", 7, 140, 50),
    n("user-db", "User DB", 180, 260, "cylinder", 1, 120, 50),
    n("order-db", "Order DB", 360, 260, "cylinder", 3, 120, 50),
  ],
  edges: [
    e("e1", "api-gw", "auth-svc"),
    e("e2", "api-gw", "user-svc"),
    e("e3", "api-gw", "order-svc"),
    e("e4", "api-gw", "notif-svc"),
    e("e5", "user-svc", "user-db"),
    e("e6", "order-svc", "order-db"),
  ],
};

const cicdPipeline: CanvasTemplate = {
  id: "cicd-pipeline",
  name: "CI/CD Pipeline",
  description:
    "Automated build, test, and deploy stages from code push to production.",
  nodes: [
    n("push", "Code Push", 0, 50, "hexagon", 0, 120, 60),
    n("build", "Build", 170, 50, "rectangle", 1, 120, 60),
    n("test", "Test Suite", 340, 50, "rectangle", 6, 130, 60),
    n("scan", "Security Scan", 520, 50, "rectangle", 4, 140, 60),
    n("staging", "Deploy Staging", 710, 50, "rectangle", 3, 150, 60),
    n("approval", "Approval Gate", 910, 30, "diamond", 5, 150, 80),
    n("prod", "Deploy Prod", 1110, 50, "rectangle", 7, 130, 60),
  ],
  edges: [
    e("e1", "push", "build"),
    e("e2", "build", "test"),
    e("e3", "test", "scan"),
    e("e4", "scan", "staging"),
    e("e5", "staging", "approval"),
    e("e6", "approval", "prod"),
  ],
};

const eventDriven: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description:
    "Producers publish events to a central bus, consumed by downstream services.",
  nodes: [
    n("order-svc", "Order Service", 0, 60, "pill", 3, 150, 50),
    n("user-svc", "User Service", 0, 160, "pill", 6, 150, 50),
    n("payment-svc", "Payment Service", 0, 260, "pill", 4, 150, 50),
    n("bus", "Event Bus", 250, 155, "hexagon", 1, 150, 70),
    n("email-svc", "Email Service", 510, 40, "rectangle", 2, 150, 50),
    n("analytics", "Analytics", 510, 140, "rectangle", 7, 150, 50),
    n("warehouse", "Data Warehouse", 510, 240, "cylinder", 0, 160, 50),
    n("notif-svc", "Notifications", 510, 330, "rectangle", 5, 150, 50),
  ],
  edges: [
    e("e1", "order-svc", "bus"),
    e("e2", "user-svc", "bus"),
    e("e3", "payment-svc", "bus"),
    e("e4", "bus", "email-svc"),
    e("e5", "bus", "analytics"),
    e("e6", "bus", "warehouse"),
    e("e7", "bus", "notif-svc"),
    e("e8", "analytics", "warehouse"),
  ],
};

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  microservices,
  cicdPipeline,
  eventDriven,
];
