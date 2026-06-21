import { getGeminiModel } from "./geminiClient.js";
import { parseAiJsonObject } from "../../utils/parseAiJson.js";
import { limitText } from "../../utils/text.js";

// Layout algorithm to convert clean hierarchical JSON to React Flow format
const layoutMindMap = (tree) => {
  const nodes = [];
  const edges = [];
  let nodeIdCounter = 1;

  const traverse = (node, parentId = null, depth = 0, siblingIndex = 0, totalSiblings = 1, parentX = 400) => {
    const id = `node-${nodeIdCounter++}`;
    
    // Determine positioning parameters based on depth and spacing
    const ySpacing = 140;
    const xSpread = depth === 0 ? 300 : depth === 1 ? 160 : 100;

    const y = 50 + depth * ySpacing;
    
    // Calculate horizontal offsets centered around the parent node's X position
    let x = parentX;
    if (depth > 0) {
      const startX = parentX - ((totalSiblings - 1) * xSpread) / 2;
      x = startX + siblingIndex * xSpread;
    }

    // Assign node details
    nodes.push({
      id,
      type: depth === 0 ? "input" : (node.children && node.children.length > 0) ? "default" : "output",
      data: { label: node.name },
      position: { x, y },
      style: {
        background: depth === 0 
          ? "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)" 
          : depth === 1 
            ? "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" 
            : "#ffffff",
        color: depth < 2 ? "#ffffff" : "#1f2937",
        border: depth < 2 ? "none" : "2px solid #e5e7eb",
        borderRadius: "12px",
        padding: "10px 14px",
        fontWeight: depth === 0 ? "bold" : depth === 1 ? "600" : "500",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        fontSize: depth === 0 ? "15px" : depth === 1 ? "13px" : "12px",
        width: 140,
        textAlign: "center"
      }
    });

    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${id}`,
        source: parentId,
        target: id,
        animated: depth === 1,
        style: { stroke: depth === 1 ? "#4f46e5" : "#0891b2", strokeWidth: depth === 1 ? 3 : 2 },
      });
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach((child, index) => {
        traverse(child, id, depth + 1, index, node.children.length, x);
      });
    }
  };

  traverse(tree);
  return { nodes, edges };
};

export const generateMindMap = async (text, filename) => {
  try {
    const model = getGeminiModel();

    const prompt = `
    Analyze the following study material and construct a conceptual hierarchy that captures the key relationships between topics.
    
    Return ONLY valid JSON representing the concept hierarchy with this exact structure:
    {
      "name": "Main Core Subject",
      "children": [
        {
          "name": "Sub-topic or Chapter",
          "children": [
            { "name": "Key Detail or Element A" },
            { "name": "Key Detail or Element B" }
          ]
        },
        ...
      ]
    }

    Aim for a depth of 3 levels (Root -> Sub-topics -> Key Details) with 2-4 sub-topics at level 1, and 2-3 key details under each sub-topic.
    Keep concept names short (1-4 words).
    
    Filename: ${filename}
    
    Study material text:
    ${limitText(text, 12000)}
    `;

    console.log("[MindMap] Generating conceptual tree...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = await response.text();

    const tree = parseAiJsonObject(responseText, "MindMap Hierarchy");
    return layoutMindMap(tree);
  } catch (error) {
    console.error("MindMap generation error, using fallback:", error);
    // Create a fallback tree structure
    const fallbackTree = {
      name: "Study Material",
      children: [
        {
          name: "Syllabus Foundations",
          children: [
            { name: "Core definitions" },
            { name: "Historical background" }
          ]
        },
        {
          name: "Practical Mechanics",
          children: [
            { name: "Key processes" },
            { name: "Technical rules" }
          ]
        },
        {
          name: "Synthesis & Review",
          children: [
            { name: "Self assessment" },
            { name: "Performance indicators" }
          ]
        }
      ]
    };
    return layoutMindMap(fallbackTree);
  }
};
