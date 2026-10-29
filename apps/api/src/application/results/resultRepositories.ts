import type { AppointmentRepository } from "../../domain/appointments/AppointmentRepository.js";
import type { ResultRepository } from "../../domain/results/ResultRepository.js";
import type { MedTeamRepository } from "../../domain/scheduling/MedTeamRepository.js";
import type { AppointmentViewer } from "../appointments/GetAppointment.js";

export interface ResultRepositories {
  appointments: AppointmentRepository;
  teams: MedTeamRepository;
  results: ResultRepository;
}

/** Who is asking about results. */
export interface ResultViewer extends AppointmentViewer {
  /** results.review: doctors see drafts and every file, released or not. */
  canReview: boolean;
}
