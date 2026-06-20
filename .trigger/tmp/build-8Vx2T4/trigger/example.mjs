import {
  task
} from "../chunk-UDT47YS7.mjs";
import "../chunk-EGZK6IS6.mjs";
import {
  logger
} from "../chunk-URGQV7AS.mjs";
import "../chunk-SWHIG6NR.mjs";
import "../chunk-SUEB6BZT.mjs";
import {
  __name,
  init_esm
} from "../chunk-S5CDDQOF.mjs";

// trigger/example.ts
init_esm();
var helloWorldTask = task({
  id: "hello-world",
  run: /* @__PURE__ */ __name(async (payload) => {
    logger.log("Hello, World!", { message: payload.message });
    return { success: true, message: payload.message };
  }, "run")
});
export {
  helloWorldTask
};
//# sourceMappingURL=example.mjs.map
