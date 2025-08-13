/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as academic from "../academic.js";
import type * as academicSessions from "../academicSessions.js";
import type * as admin from "../admin.js";
import type * as alerts from "../alerts.js";
import type * as applications from "../applications.js";
import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as authHelpers from "../authHelpers.js";
import type * as beneficiaries from "../beneficiaries.js";
import type * as documents from "../documents.js";
import type * as files from "../files.js";
import type * as financial from "../financial.js";
import type * as foundations from "../foundations.js";
import type * as http from "../http.js";
import type * as programs from "../programs.js";
import type * as reports from "../reports.js";
import type * as schools from "../schools.js";
import type * as setup from "../setup.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  academic: typeof academic;
  academicSessions: typeof academicSessions;
  admin: typeof admin;
  alerts: typeof alerts;
  applications: typeof applications;
  attendance: typeof attendance;
  auth: typeof auth;
  authHelpers: typeof authHelpers;
  beneficiaries: typeof beneficiaries;
  documents: typeof documents;
  files: typeof files;
  financial: typeof financial;
  foundations: typeof foundations;
  http: typeof http;
  programs: typeof programs;
  reports: typeof reports;
  schools: typeof schools;
  setup: typeof setup;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
