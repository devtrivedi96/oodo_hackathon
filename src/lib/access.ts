import { UserRole } from "./db";

export type AppView =
  | "dashboard"
  | "vehicles"
  | "drivers"
  | "trips"
  | "maintenance"
  | "expenses"
  | "analytics";

interface ViewAccess {
  id: AppView;
  label: string;
  roles: UserRole[];
}

export const VIEW_ACCESS: ViewAccess[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    roles: ["Manager", "Dispatcher", "Safety Officer", "Analyst"],
  },
  {
    id: "vehicles",
    label: "Vehicles",
    roles: ["Manager", "Dispatcher", "Safety Officer", "Analyst"],
  },
  {
    id: "drivers",
    label: "Drivers",
    roles: ["Manager", "Dispatcher", "Safety Officer", "Analyst"],
  },
  {
    id: "trips",
    label: "Trips",
    roles: ["Manager", "Dispatcher", "Analyst"],
  },
  {
    id: "maintenance",
    label: "Maintenance",
    roles: ["Manager", "Analyst"],
  },
  {
    id: "expenses",
    label: "Expenses",
    roles: ["Manager", "Analyst"],
  },
  {
    id: "analytics",
    label: "Analytics",
    roles: ["Manager", "Analyst"],
  },
];

export const getAllowedViewsForRole = (role: UserRole): AppView[] =>
  VIEW_ACCESS.filter((view) => view.roles.includes(role)).map((view) => view.id);

export const canRoleAccessView = (role: UserRole, view: AppView): boolean =>
  VIEW_ACCESS.some((item) => item.id === view && item.roles.includes(role));
