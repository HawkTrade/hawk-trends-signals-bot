import { bold, fmt, italic, join, spoiler } from "telegraf/format";
import type {
  CreatePipeline,
  LocalPipeline,
  Pipeline,
} from "../models/db.model";

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
    return `No pipelines available to ${action}`;

  const pipeline_msg = pipelines.map(
    (p, i) => fmt`${bold(`${i + 1}.`)} ${p.name}`
  );

  return fmt`${bold("Here are the list of pipelines: ")}
  
${join(pipeline_msg, "\n")}

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

  const pipeline_msg = pipelines.map(
    (p, i) =>
      fmt`
${bold(`${i + 1}. ${p.name}`)}
  ${italic(p.description)}
  ${bold("Brands:")} ${p.brands[0]}`
  );

  return fmt`${bold(msg)}

  ${join(pipeline_msg, "\n\n")}`;
}

function getPipelineSummary(msg: string, pipeline: Pipeline) {
  return fmt`${bold(msg)}

${bold("Name:")} ${pipeline.name}
${bold("Description:")} ${pipeline.description}
${bold("Brand:")} ${pipeline.brands[0]}
${bold("Strategy ID:")} ${spoiler`${pipeline.strategyId}`}

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
