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

const requiresConfig = fmt`${bold`Do you want to set trade Config?`}

Trade configuration options for default take profit and stop loss (in percentage) will activate after you select/type Yes
Trade config options are only used if LLM/Regex parsing doesn't pick up a take profit or stop loss value from its message source!

${italic`Selecting/Typing No and any other text will assume negative and proceed to show you a summary for your new pipeline!`}
`;

function createPipelineSummary(pipeline: CreatePipeline, original = true) {
  return fmt`
${bold("Here’s a summary of your new pipeline:")}

${bold("Title:")} ${pipeline.pipeline}
${bold("Description:")} ${pipeline.description}
${bold("Brand:")} ${pipeline.brands[0]}

${bold`Trade Configuration Details`}
${bold`Take Profit %`} ${pipeline.tp ?? "Not Set"}
${bold`Stop Loss %`} ${pipeline.sl ?? "Not Set"}

${
  original
    ? italic(
        "If everything looks correct, confirm to create this pipeline or cancel to start over."
      )
    : ""
}`;
}

type LocalPipelineAction = "remove" | "view" | "edit";
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
  ${bold("Brands:")} ${p.brands[0]}
  ${bold`Take Profit:`} % ${p.takeProfit ?? "Not Set"}
  ${bold`Stop Loss:`} % ${p.stopLoss ?? "Not Set"}
  `
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

${bold`Trade Configuration Details`}
${bold`Take Profit %`} ${pipeline.takeProfit ?? "Not Set"}
${bold`Stop Loss %`} ${pipeline.stopLoss ?? "Not Set"}

Created at: ${italic(new Date(pipeline.created_at).toISOString())}
Updated at: ${italic(new Date(pipeline.updated_at).toISOString())}`;
}

export {
  selectBrandForPipelineMessage,
  createPipelineMessage,
  describePipelineMessage,
  requiresConfig,
  createPipelineSummary,
  localPipelineMessage,
  fullPipelineMessage,
  getPipelineSummary,
};
