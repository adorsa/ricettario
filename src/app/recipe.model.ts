export interface Ingredient {
  name: string;
  qty: number;
  unit: string;
}

export interface IngredientsMap {
  [id: string]: Ingredient;
}

export interface RecipeStep {
  id: string;
  text: string;
  dependencies: string[];
}

export interface Recipe {
  id?: string;
  user_id?: string;
  title: string;
  servings_base: number;
  is_public: boolean;
  ingredients: IngredientsMap;
  steps: RecipeStep[];
  created_at?: string;
}

// Step status type
export type StepWorkflowStatus = 'LOCKED' | 'READY' | 'PENDING' | 'COMPLETED';
