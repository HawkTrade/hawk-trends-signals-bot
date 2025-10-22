import { bold, fmt, italic } from "telegraf/format";
import { CreatePipeline, LocalPipeline, Pipeline } from "../models/db.model";

const createPipelineMessage = fmt`${bold("Let's set up a new pipeline!")}
  
Please enter a clear and descriptive title for this pipeline.
${italic("The pipeline ID will be automatically generated from this title.")}`;

const describePipelineMessage = fmt`${bold("Great!")}
  
Now, please provide a short description for what this pipeline does. 
${italic("This helps you and others understand its purpose later.")}`;

const selectBrandForPipelineMessage = fmt`${bold("Almost done!")}
  
Please select the brand this pipeline belongs to from the keyboard below.
${italic("Custom brand entries aren’t supported just yet 🫠")}`;

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

type LocalPipelineAction = "remove" | "view";
function localPipelineMessage(
  pipelines: LocalPipeline[] | undefined,
  action: LocalPipelineAction
) {
  if (!pipelines || !pipelines.length)
    return fmt`No pipelines available to ${action}`;

  const pipeline_msg = pipelines
    .map((p, i) => fmt`${bold(`${i + 1}.`)} ${p.name}`)
    .join("\n");

  return fmt`${bold("Here are the list of pipelines: ")}
  
${pipeline_msg}

${italic("Select from the buttons below, the pipeline to " + action)}`;
}

function fullPipelineMessage(
  msg: string | undefined,
  pipelines: Pipeline[] | undefined
) {
  if (!pipelines || !msg) {
    return fmt`${italic(
      "There are no pipelines in the system. Call /create_pipeline to generate one"
    )}`;
  }

  const pipeline_msg = pipelines
    .map(
      (p, i) =>
        fmt`${bold(`${i + 1}. ${p.name}`)} ${italic(
          `(${new Date(p.created_at).toLocaleDateString()})`
        )}
${italic(p.description)}
${bold("Brands:")} ${p.brands.join(", ")}`
    )
    .join("\n\n");

  return fmt`${bold(msg)}

${pipeline_msg}`;
}

function getPipelineSummary(msg: string, pipeline: Pipeline) {
  return fmt`${bold(msg)}

${bold("Name:")} ${pipeline.name}
${bold("Description:")} ${pipeline.description}
${bold("Brand:")} ${pipeline.brands[0]}

Created at: ${italic(new Date(pipeline.created_at).toISOString())}
Updated at: ${italic(new Date(pipeline.updated_at).toISOString())}`;
}

export {
  selectBrandForPipelineMessage,
  createPipelineMessage,
  describePipelineMessage,
  createPipelineSummary,
  localPipelineMessage,
  fullPipelineMessage,
  getPipelineSummary,
};
