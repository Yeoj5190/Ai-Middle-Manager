import { DEMO_EMPLOYEE_ID } from "../config";

// The currently signed-in worker's employee id. Set after login (resolved from
// the auth user via employees.auth_user_id). Falls back to the demo id only so
// nothing crashes before login; the auth gate blocks the app until it's set.
let _employeeId: string = DEMO_EMPLOYEE_ID;

export function setCurrentEmployeeId(id: string): void {
  _employeeId = id;
}
export function currentEmployeeId(): string {
  return _employeeId;
}
