import type { ListProcedureCategories } from "../../../application/use-cases/listProcedureCategories.js";
import type { Controller, HttpResponse } from "../httpTypes.js";
import { presentCategoryList } from "../presenters/catalogPresenter.js";

export class ListProcedureCategoriesController implements Controller {
  constructor(private readonly listProcedureCategories: ListProcedureCategories) {}

  async handle(): Promise<HttpResponse> {
    return presentCategoryList(await this.listProcedureCategories.execute());
  }
}
