import { DomainError } from "../errors/domainError.js";

export class ProcedureNotFound extends DomainError {
  readonly kind = "not_found";
  constructor() {
    super("Procedure not found.", "procedure_not_found");
  }
}

export class ProcedureCodeTaken extends DomainError {
  readonly kind = "conflict";
  constructor() {
    super("Another procedure already uses this code.", "procedure_code_taken");
  }
}

export class ProcedureNameTaken extends DomainError {
  readonly kind = "conflict";
  constructor() {
    super("Another procedure already has this name.", "procedure_name_taken");
  }
}

export class InvalidProcedure extends DomainError {
  readonly kind = "validation";
  constructor(message: string) {
    super(message, "invalid_procedure");
  }
}

export class CategoryNotFound extends DomainError {
  readonly kind = "not_found";
  constructor() {
    super("Category not found.", "category_not_found");
  }
}

export class CategoryNameTaken extends DomainError {
  readonly kind = "conflict";
  constructor() {
    super("A category with this name already exists.", "category_name_taken");
  }
}

export class CategoryInUse extends DomainError {
  readonly kind = "conflict";
  constructor(procedureCount: number) {
    super(
      `${procedureCount} ${procedureCount === 1 ? "procedure is" : "procedures are"} in this category. Move them to another category first.`,
      "category_in_use",
    );
  }
}
