import { StateGraph, START, END } from "@langchain/langgraph";

import { RoadmapState } from "./roadmap.state.js";

import roadmapAgent from "../agents/roadmap.agent.js";
import resourceAgent from "../agents/resource.agent.js";

const roadmapGraph = new StateGraph(RoadmapState)

  // Register Nodes
  .addNode("roadmapAgent", roadmapAgent)
  .addNode("resourceAgent", resourceAgent)

  // Workflow
  .addEdge(START, "roadmapAgent")
  .addEdge("roadmapAgent", "resourceAgent")
  .addEdge("resourceAgent", END);

const graph = roadmapGraph.compile();

export default graph;