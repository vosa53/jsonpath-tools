import { WorkerBackend } from "./worker-backend";
import { WorkerRPC } from "./worker-rpc";
import { DisconnectWorkerMessage, GetCompletionsWorkerMessage, GetDiagnosticsWorkerMessage, GetResultWorkerMessage, UpdateOptionsWorkerMessage, UpdateQueryArgumentWorkerMessage, UpdateQueryWorkerMessage } from "./worker-messages";

const rpc = new WorkerRPC<WorkerBackend>(i => postMessage(i), t => new WorkerBackend(t));
addEventListener("message", e => rpc.receive(e.data));

rpc.addHandlerAction("updateOptions", (h, message: UpdateOptionsWorkerMessage) => h.updateOptions(message));
rpc.addHandlerAction("updateQuery", (h, message: UpdateQueryWorkerMessage) => h.updateQuery(message));
rpc.addHandlerAction("updateQueryArgument", (h, message: UpdateQueryArgumentWorkerMessage) => h.updateQueryArgument(message));
rpc.addHandlerAction("getCompletions", (h, message: GetCompletionsWorkerMessage) => h.getCompletions(message));
rpc.addHandlerAction("getDiagnostics", (h, message: GetDiagnosticsWorkerMessage) => h.getDiagnostics(message));
rpc.addHandlerAction("getResult", (h, message: GetResultWorkerMessage) => h.getResult(message));
rpc.addHandlerAction("disconnect", (h, message: DisconnectWorkerMessage) => h.disconnect(message));
