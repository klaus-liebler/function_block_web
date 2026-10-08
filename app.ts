import "@klaus-liebler/web-components/style/dialog.css"
import "./style/app.css"
import { render } from "lit-html";
import { Severity, severity2class, severity2symbol } from "@klaus-liebler/commons";
import { DialogController } from "@klaus-liebler/web-components/typescript/dialog_controller";
import { Html } from "@klaus-liebler/web-components/typescript/utils/common";
import { HEADER_BACKGROUND_DATA_URL } from "@klaus-liebler/web-components/typescript/utils/header_background";
import { Flowchart, FlowchartCallback, FlowchartOptions, IFlowchartHost } from "@klaus-liebler/flowchart";

// Standalone-Host: statt AppController (Websocket, Router, Login) nur Dialog und Snackbar.
// Der Flowchart bekommt KEIN IFlowchartDevice -> nur Editor, Simulation und lokaler Import/Export.
class StandaloneHost implements IFlowchartHost {
  private snackbarTimeout = -1;

  constructor(private dialogContainer: HTMLElement, private snackbar: HTMLElement) { }

  ShowDialog(d: DialogController): void {
    render(d.Template(), this.dialogContainer);
    d.Show();
  }

  ShowSnackbar(severity: Severity, text: string, timeout = 3000): void {
    window.clearTimeout(this.snackbarTimeout);
    this.snackbar.innerText = "";
    Html(this.snackbar, "span", [], [severity2class(severity)], severity2symbol(severity));
    Html(this.snackbar, "span", [], [], text);
    this.snackbar.classList.add("visible");
    this.snackbarTimeout = window.setTimeout(() => this.snackbar.classList.remove("visible"), timeout);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const host = new StandaloneHost(document.getElementById("dialog")!, document.getElementById("snackbar")!);
  const fc = new Flowchart(host, { operators: [], links: [] }, new FlowchartCallback(), new FlowchartOptions());
  const container = <HTMLDivElement>document.getElementById("fbd");
  fc.RenderUi(container);

  // Header wie im AppController (labathome), Footer mit Build-Infos
  document.getElementById("app-header")!.style.backgroundImage = `url('${HEADER_BACKGROUND_DATA_URL}')`;
  document.getElementById("footer-year")!.textContent = `${new Date().getFullYear()}`;
  const blockCount = container.querySelectorAll(".oplib-item").length;
  const buildTime = new Date(__BUILD_TIME__).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
  document.getElementById("footer-build")!.textContent =
    `v${__APP_VERSION__} · ${blockCount} function blocks · built ${buildTime} · flowchart ${__FLOWCHART_GIT__}`;
});
