import type { AppointmentRepository } from "../../domain/appointments/AppointmentRepository.js";
import type { PaymentRepository } from "../../domain/payments/PaymentRepository.js";
import type { MedTeamRepository } from "../../domain/scheduling/MedTeamRepository.js";

export interface PaymentRepositories {
  appointments: AppointmentRepository;
  teams: MedTeamRepository;
  payments: PaymentRepository;
}
