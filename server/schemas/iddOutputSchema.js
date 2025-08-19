// server/schemas/iddOutputSchema.js
export const IDD_OUTPUT_SCHEMA = {
  meta: {
    student_name: "",
    age_grade: "",
    mode: "",
    topic: "",
    date_generated: ""
  },
  views: {
    teacher: {
      objective: "",
      lesson_script: [],       // Array of short steps
      scaffolds: [],           // Key supports only
      home_practice: "",       // 1–2 sentences
      progress_monitoring: {}  // Short: metric + frequency
    },
    parent: {
      objective: "",
      daily_routine: [],       // Simple steps
      home_practice: "",       // Short task
      refusal_script: ""       // Quick handling phrase
    },
    assistant: {
      quick_cues: []
    }
  }
};

export const IDD_OUTPUT_JSON_SCHEMA = {
  type: "object",
  properties: {
    meta: {
      type: "object",
      properties: {
        student_name: { type: "string" },
        age_grade: { type: "string" },
        mode: { type: "string" },
        topic: { type: "string" },
        date_generated: { type: "string" }
      },
      required: ["student_name", "age_grade", "mode", "topic", "date_generated"]
    },
    views: {
      type: "object",
      properties: {
        teacher: {
          type: "object",
          properties: {
            objective: { type: "string" },
            lesson_script: { type: "array" },
            scaffolds: { type: "array" },
            home_practice: { type: "string" },
            progress_monitoring: { type: "object" }
          },
          required: ["objective", "lesson_script", "scaffolds", "home_practice", "progress_monitoring"]
        },
        parent: {
          type: "object",
          properties: {
            objective: { type: "string" },
            daily_routine: { type: "array" },
            home_practice: { type: "string" },
            refusal_script: { type: "string" }
          },
          required: ["objective", "daily_routine", "home_practice", "refusal_script"]
        },
        assistant: {
          type: "object",
          properties: {
            quick_cues: { type: "array" }
          },
          required: ["quick_cues"]
        }
      },
      required: ["teacher", "parent", "assistant"]
    }
  },
  required: ["meta", "views"]
};
