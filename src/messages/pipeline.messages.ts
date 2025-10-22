import { bold, fmt, italic } from "telegraf/format";
import { CreatePipeline } from "../models/db.model";

const createPipelineMessage = fmt`${bold("Let's set up a new pipeline!")}
  
Please enter a clear and descriptive title for this pipeline.
${italic("The pipeline ID will be automatically generated from this title.")}`;

const describePipelineMessage = fmt`${bold("Great!")}
  
Now, please provide a short description for what this pipeline does. 
${italic("This helps you and others understand its purpose later.")}`;

const selectBrandForPipelineMessage = fmt`${bold("Almost done!")}
  
Please select the brand this pipeline belongs to from the keyboard below.
${italic("Custom brand entries aren’t supported just yet 🫠")}`;

const selectBrandForPipeline = {
  keyboard: [[{ text: "ArcDefi" }, { text: "Hawk" }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

function createPipelineSummary(pipeline: CreatePipeline, original = true) {
  return fmt`
${bold("Here’s a summary of your new pipeline:")}

${bold("Title:")} ${pipeline.pipeline}
${bold("Description:")} ${pipeline.description}
${bold("Brand:")} ${pipeline.brands[0]}

${
  original
    ? italic(
        "If everything looks correct, confirm to create this pipeline or cancel to start over."
      )
    : ""
}`;
}

const actionCreatePipelineKeyboard = {
  inline_keyboard: [
    [
      { text: "✅ Confirm", callback_data: "pipeline_create:confirm" },
      { text: "❌ Cancel", callback_data: "pipeline_create:cancel" },
    ],
  ],
};

export {
  selectBrandForPipeline,
  selectBrandForPipelineMessage,
  createPipelineMessage,
  describePipelineMessage,
  actionCreatePipelineKeyboard,
  createPipelineSummary,
};
