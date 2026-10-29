import {
  resultsState,
  type ResultsState,
  type TestResult,
  testsNeedingResults,
} from "../../domain/results/result.js";
import { findViewable } from "../appointments/GetAppointment.js";
import type { ResultRepositories, ResultViewer } from "./resultRepositories.js";

export interface TestResultsRow {
  procedureId: string;
  code: string;
  name: string;
  /** Null when there's none yet, or the viewer may not see it. */
  result: TestResult | null;
}

export interface AppointmentResultsOutput {
  state: ResultsState;
  /** The viewer reviews results: may upload, remove drafts and release. */
  canManage: boolean;
  tests: TestResultsRow[];
}

/**
 * The results of a visit's collected tests. Doctors see drafts too; the patient sees the files
 * only once they're released and the visit is paid; anyone else who can open the visit only
 * sees where things stand.
 */
export class GetAppointmentResults {
  constructor(private readonly repositories: ResultRepositories) {}

  async execute(appointmentId: string, viewer: ResultViewer): Promise<AppointmentResultsOutput> {
    const { appointment, access } = await findViewable(this.repositories, appointmentId, viewer);
    const results = await this.repositories.results.listForAppointment(appointmentId);
    const state = resultsState(appointment, results);
    const canManage = access !== "patient" && viewer.canReview;
    const showFiles = canManage || (access === "patient" && state === "ready");

    return {
      state,
      canManage,
      tests: testsNeedingResults(appointment).map((line) => ({
        procedureId: line.procedureId,
        code: line.code,
        name: line.name,
        result: showFiles
          ? (results.find((result) => result.procedureId === line.procedureId) ?? null)
          : null,
      })),
    };
  }
}
