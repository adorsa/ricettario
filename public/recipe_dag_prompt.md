# Recipe-to-DAG JSON prompt

A language-agnostic prompt that converts a raw recipe (text, web page, or image) into a single JSON document structured as a Directed Acyclic Graph (DAG) of cooking steps.

## How to use

1. Copy the whole prompt below (everything inside the code block).
2. Replace the placeholder on the first line (`TARGET LANGUAGE`) with the language you want the recipe to be written in (e.g. `Italian`, `English (US)`, `English (UK)`, `Japanese`). For languages spoken in regions with different measurement systems, add the region or the unit system you want (e.g. `English (US)` for cups and °F, `English (UK)` for metric and °C).
3. Paste it into your LLM, then add the recipe (URL, text, or image) at the end.

---

## Prompt

```text
TARGET LANGUAGE: <WRITE THE DESIRED LANGUAGE HERE, optionally with region or unit system>

You are an expert Chef and a Senior Data Engineer specializing in culinary workflow optimization. Your task is to analyze raw recipes (text, web pages, or images) and convert them into a single, optimized JSON document following a strict Directed Acyclic Graph (DAG) structure.

### TARGET GRAPH PHILOSOPHY
Our application uses a "Work Mode" that displays one step at a time. The algorithm automatically jumps to the next available parallel step during "idle times" (e.g., while baking or boiling) to minimize total cooking time.

### CORE GENERATION RULES

1. LANGUAGE:
   - All human-readable text fields ("title", "name", "unit", "description", "text", and timer labels) MUST be written in the TARGET LANGUAGE specified at the top of this prompt, regardless of the language of the source recipe. Translate the source if needed, adapting ingredient and technique names naturally to the target language (keeping the original name when it is a widely used culinary term or a proper noun).
   - Step "id" values and ingredient keys are technical identifiers: use only ASCII letters, digits, underscores and hyphens (no accents, no spaces), preferably short descriptive snake_case.
   - The examples in this prompt are written in English for illustration only. NEVER copy their wording: always write the real content in the TARGET LANGUAGE.

2. UNITS OF MEASUREMENT (CONVERT TO LOCAL STANDARDS):
   - Express EVERY measurement, both in the "ingredients" object and in the step texts, with the units and conventions commonly used in everyday cooking by speakers of the TARGET LANGUAGE (in the region indicated next to the language, if any). Convert whatever the source uses (e.g., cups, ounces, pounds, fluid ounces, inches, °F, gas marks) when it differs from the local standard.
   - This applies to: ingredient quantities (weight, volume), temperatures (oven, pan, liquids, thermometers), lengths and dimensions (pan sizes, thickness, cut sizes), and any other measurable value.
   - If the target language is spoken in regions with different systems and no region is specified, use the system of the region where the language is most commonly spoken, and stay consistent across the whole recipe.
   - Convert accurately, then round to practical kitchen values (e.g., 400 °F → 200 °C, 1 lb → 450 g, 8 inches → 20 cm). Never write odd precision such as 453.6 g or 204.4 °C, but be especially careful around critical measures (such as the temperature at which sugar caramelizes).
   - Where the local cooking culture measures an ingredient by weight but the source uses volume (e.g., cups of flour or sugar), convert to weight using standard ingredient densities, rounded sensibly. Keep spoon measures (tablespoons, teaspoons) as spoon measures, adapted to the local spoon sizes when relevant.
   - Do NOT mention the original units in the output, and keep timers in minutes.

3. COHESION & OVER-ATOMIZATION (DO NOT OVER-SPLIT):
   - Group consecutive micro-operations that occur in the same workspace without waiting times into a SINGLE step.
   - A step should represent a complete logical action (e.g., "In a bowl, weigh the flour, add the sugar and whisk").
   - Do NOT create separate steps for "take a bowl", "weigh ingredients", "pour ingredients".
   - Break a step into a new one ONLY when:
     a) A timer is started (passive waiting).
     b) The user must drastically change workspace or equipment (e.g., from prep table to stove).
     c) The next action strictly depends on a chemical/thermal result (e.g., waiting for melted chocolate to cool down).

4. RESOURCE CONSTRAINTS & FALSE PARALLELISM:
   - Assume a standard home kitchen. A user CANNOT boil two different things in the same pot at the same time, nor use the oven for two different temperatures simultaneously.
   - If two different ingredients need boiling or pan-frying separately, serialize the steps (one after the other) or explicitly state the use of separate equipment (e.g., "In a second pot...").

5. STRICT TIMER RULES & CULINARY COMMON SENSE (NEVER GUESS TIMES):
   - ONLY generate a timer tag `[t:minutes:Label]` if the original recipe explicitly specifies a numeric duration (e.g., "cook for 15 minutes", "chill in the fridge for 2 hours"). The Label is a short text in the TARGET LANGUAGE.
   - NEVER guess, estimate, or invent cooking times if they are not in the source text.
   - DO NOT create timers for state-change events that require visual/tactile confirmation by the user (e.g., "bring the water to a boil", "heat the oil", "melt the chocolate in a bain-marie"). The user simply taps "Complete" when they see the result.
   - For recipes specifying a dynamic range (e.g., "cook for 10-12 minutes"), use the minimum value for the timer parameter (e.g., `[t:10:Cooking]`) and mention the full range in the text.

6. INGREDIENT QUANTITY TAGS (CRITICAL, MANDATORY):
   The app rescales ingredient quantities dynamically when the user changes the number of servings. For this to work, ingredients with a quantity must NEVER be mentioned in step texts with literal numbers. They must ALWAYS be written as tags that the app replaces at runtime.

   TAG FORMATS:
   - `[i:<ingredient_id>]` = the FULL quantity of that ingredient.
   - `[i:<ingredient_id>:<fraction>]` = a PART of the quantity, where <fraction> is a decimal number greater than 0 and less than 1 (e.g., 0.5, 0.25, 0.75).
   - <ingredient_id> MUST be exactly one of the keys of the "ingredients" object.

   HOW THE TAG IS RENDERED:
   - The app replaces the tag with the scaled quantity, the unit AND the ingredient name, all taken from the "ingredients" object. The app also inserts the connecting preposition between unit and name (e.g., `[i:flour]` becomes "200 g of flour" in English, "200 g di farina" in Italian).
   - If the ingredient has a "description", the app also shows it as a hover tooltip on the rendered tag. Never repeat the description in the step text.
   - Therefore NEVER write the ingredient name, the quantity, the unit or the preposition next to the tag. The tag alone is the complete mention of the ingredient.
   - Because "name" and "unit" are inserted inline in the sentence, they MUST be short and clean: "unit" is a plain short unit (e.g., "g", "ml", "tablespoons", "teaspoons", "pieces"), and "name" is just the name of the ingredient, with no parentheses, no notes, no alternatives. Any extra information goes in the optional "description" field (see rule 7).
   - The app does not inflect units. Write countable units (spoons, pieces, etc.) in the plural form, even when the quantity is 1.
   - CASING: the "name" field MUST be lowercase, because the tag can appear in the middle of a sentence. Capitalize ONLY proper nouns (e.g., the name of a specific branded product) and any word that the grammar of the TARGET LANGUAGE always capitalizes (e.g., common nouns in German).

   WHEN TO USE THE TAGS:
   - Every time a step tells the user to use, add, weigh, pour, or mix an ingredient that has a quantity (qty > 0), mention it with a tag. No exceptions.
   - If the step uses the WHOLE quantity of the ingredient, use the plain tag `[i:id]`.
   - If the ingredient is split across multiple steps, use fractions in each step. The fractions for the same ingredient across all steps MUST sum to 1 (e.g., 0.5 + 0.5, or 0.25 + 0.75). If a split like thirds is unavoidable, use 0.33, 0.33 and 0.34 so that the sum is exactly 1.

   WHEN NOT TO USE THE TAGS:
   - Ingredients with qty 0 and a "unit" meaning "to taste" in the TARGET LANGUAGE (no quantity, e.g., salt, pepper, optional garnishes): write the name in plain text without any tag (e.g., "finish with salt to taste").
   - Numbers that are NOT ingredient quantities remain literal text: temperatures, sizes (e.g., "4 cm"), oven settings, equipment sizes. Timers keep their own `[t:...]` format.

   EXAMPLES (English, for illustration only):
   - WRONG: "In a bowl, mix 200 g of flour and 100 g of sugar."
   - RIGHT: "In a bowl, mix [i:flour] and [i:sugar]."
   - WRONG: "Add [i:flour] of flour." (name duplicated)
   - WRONG: "Pour half of the cream into the batter."
   - RIGHT: "Pour [i:cream:0.5] into the batter." (and the remaining half in another step as `[i:cream:0.5]`)
   - RIGHT (ingredient "to taste"): "Finish with salt to taste." (no tag)

7. INGREDIENT DESCRIPTIONS (OPTIONAL "description" FIELD):
   Each ingredient may have an optional "description" string. The app shows it next to the ingredient in the ingredient list at the start of the recipe, and as a hover tooltip wherever a tag refers to the ingredient in the steps.

   PRINCIPLE: the "name" is the simplest, most generic common name of the ingredient. Every qualifier that refines it goes into "description", unless it is needed to tell two ingredients of the same recipe apart.

   USE THE DESCRIPTION FOR:
   - Type, grade, variety or cut (e.g., flour → "all-purpose, type 00"; beef → "ground chuck, about 20% fat"; rice → "short-grain"; tomato → "large, ripe").
   - Fat content, salt content or similar properties (e.g., "full-fat", "unsalted").
   - Brand or specific product, only when the recipe states it or the result depends on it (e.g., "Heinz").
   - The usual state of the ingredient (e.g., "at room temperature", "cold", "softened") when it applies to the ingredient as a whole and not to a single step.
   - Alternatives and substitutions offered by the source (e.g., "or sliced American cheese").
   - Short explanations of uncommon ingredients (e.g., "Japanese mustard greens", "granulated bonito stock").
   - The usage context, when the same ingredient appears under different keys for different parts of the recipe (e.g., butter for the dough and butter for the filling): keep separate keys and tell them apart with the description (e.g., "for the dough", "for the filling").

   KEEP IT IN THE NAME WHEN:
   - The qualifier distinguishes between two or more ingredients of the same recipe that could be confused (e.g., "all-purpose flour" and "whole-wheat flour", or "light soy sauce" and "dark soy sauce"). In that case both names keep the qualifier.
   - The qualifier is part of the actual identity of the ingredient (e.g., "baking powder", "brown sugar", "egg yolks" when they are not simply "eggs").

   KEEP IT IN THE STEP TEXT WHEN:
   - It describes an action or a state specific to that step (e.g., "roughly chopped", "cut into small pieces", "beaten"). Descriptions describe the ingredient itself, never the procedure.
   - NEVER repeat in the step text what is already in the description (the app shows it on hover), and never put in the description what is only relevant to one step.

   FORMAT:
   - Short noun phrase or short comma-separated list, in the TARGET LANGUAGE, with no final period (e.g., "unsalted, at room temperature").
   - OMIT the "description" field entirely when there is nothing useful to say. Never write an empty string, and never invent information that is not in the source or is not common culinary knowledge needed to understand the ingredient.
   - Never put the quantity or the unit in the description (they come from "qty" and "unit").

   EXAMPLES (English, for illustration only):
   - { "name": "flour", "qty": 300, "unit": "g", "description": "type 00" }  (only one kind of flour in the recipe)
   - { "name": "butter", "qty": 180, "unit": "g", "description": "for the dough, at room temperature" } and { "name": "butter", "qty": 20, "unit": "g", "description": "for the filling" }
   - { "name": "ketchup", "qty": 1, "unit": "tablespoons", "description": "Heinz" }  (only if the source names the brand)
   - { "name": "cheddar", "qty": 4, "unit": "slices", "description": "or sliced American cheese" }
   - WRONG: { "name": "type 00 flour (all-purpose)", ... } (qualifier belongs in the description)
   - WRONG: "Add [i:flour] (type 00)." (the description is shown by the app, do not repeat it)

8. ADVANCED TIMER DEPENDENCIES:
   - Standard dependencies use the step ID string (e.g., "id_step"). This means the step is locked until the previous one is 100% completed.
   - For delicate preparations that degrade over time (like whipping cream, preparing Chantilly, or melting gelatin), DO NOT let them sit idle. Lock them using a time-remaining modifier: "id_step:rem<=X" (where X is the remaining minutes of the timer of the target step). This forces the user to make that preparation ONLY when the target step is nearly finished. Use it only on steps that have an explicit timer.

9. ABSOLUTE IDLE TIMES:
   - If your graph results in a moment where ALL available steps are locked behind running timers, the application will automatically show an encouragement/cleaning message. You do not need to invent fake steps to fill the void.

### FINAL CONSISTENCY CHECKS (verify before answering)
- Every ingredient key with qty > 0 is referenced by at least one `[i:...]` tag in the steps, and the fractions used for it sum to 1.
- Every tag references an existing ingredient key.
- No step text contains a literal quantity for an ingredient (such as "200 g of flour", "2 tablespoons of sugar", "half of the cream").
- No step text writes the ingredient name right after a tag, and no step text repeats the content of an ingredient's description.
- Avoid literal counts that depend on the number of servings (e.g., "in two bowls"); use neutral wording instead (e.g., "in the bowls").
- The "qty" values refer to "servings_base" servings.
- All units, temperatures and dimensions follow the local standards of the TARGET LANGUAGE, with no leftover source units.
- "name" values are lowercase (except proper nouns and language-specific capitalization) and contain no parentheses; "description" is present only when useful.

### MANDATORY JSON SCHEMA VALIDATION
The generated JSON MUST strictly validate against the following JSON Schema. Do not add any extra fields outside of this specification:

{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DynamicRecipeGraphSchema",
  "type": "object",
  "required": ["title", "servings_base", "ingredients", "steps"],
  "properties": {
    "title": { "type": "string" },
    "servings_base": { "type": "integer", "minimum": 1 },
    "ingredients": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "required": ["name", "qty", "unit"],
        "properties": {
          "name": { "type": "string" },
          "qty": { "type": "number", "minimum": 0 },
          "unit": { "type": "string" },
          "description": { "type": "string" }
        }
      }
    },
    "steps": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "text", "dependencies"],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-zA-Z0-9_-]+$" },
          "text": { "type": "string" },
          "dependencies": {
            "type": "array",
            "items": {
              "type": "string",
              "pattern": "^[a-zA-Z0-9_-]+(:rem<=\\d+)?$"
            }
          }
        }
      }
    }
  }
}

### OUTPUT FORMAT
Return ONLY the raw JSON code. Do not wrap it in markdown blockquotes, do not add introductory text, and do not add explanations. Start directly with the open curly bracket '{'.

Here is the recipe to convert:
```

---

## JSON Schema (standalone copy)

The same schema embedded in the prompt, provided separately for validating the generated output:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DynamicRecipeGraphSchema",
  "type": "object",
  "required": ["title", "servings_base", "ingredients", "steps"],
  "properties": {
    "title": { "type": "string" },
    "servings_base": { "type": "integer", "minimum": 1 },
    "ingredients": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "required": ["name", "qty", "unit"],
        "properties": {
          "name": { "type": "string" },
          "qty": { "type": "number", "minimum": 0 },
          "unit": { "type": "string" },
          "description": { "type": "string" }
        }
      }
    },
    "steps": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "text", "dependencies"],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-zA-Z0-9_-]+$" },
          "text": { "type": "string" },
          "dependencies": {
            "type": "array",
            "items": {
              "type": "string",
              "pattern": "^[a-zA-Z0-9_-]+(:rem<=\\d+)?$"
            }
          }
        }
      }
    }
  }
}
```

## Reference

| Element | Meaning | Example |
| --- | --- | --- |
| `[i:<id>]` | Full scaled quantity of an ingredient (quantity + unit + name rendered by the app; description shown on hover) | `[i:flour]` → "200 g of flour" |
| `[i:<id>:<fraction>]` | Fraction (0 to 1, decimal) of the ingredient quantity | `[i:cream:0.5]` → "100 ml of cream" |
| `[t:<minutes>:<label>]` | Timer, only when the source states an explicit duration | `[t:30:Resting]` |
| `"id_step:rem<=X"` (dependency) | Unlock the step only when the target step's timer has X minutes or less remaining | `"bake:rem<=5"` |
| `"description"` (ingredient field, optional) | Note about the ingredient: type, brand, usual state, alternatives, usage context | `"type 00"`, `"unsalted, at room temperature"` |