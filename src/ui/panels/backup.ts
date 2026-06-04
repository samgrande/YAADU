import type { Adb } from "@yume-chan/adb";
import {
  listMediaFiles,
  backupMediaFiles,
  type BackupEntry,
  type BackupProgress,
} from "../../adb/backup.js";
import { formatBytes } from "../../adb/helpers.js";
import { toast } from "../toast.js";

// ── Helpers ────────────────────────────────────────────────────────────────

function fileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const isVideo = ["mp4", "mov", "mkv", "avi", "3gp"].includes(ext);
  
  if (isVideo) {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2B2B2B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`;
  }
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2B2B2B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
}

function logLine(msg: string, kind: "ok" | "err" | "info"): string {
  return `<div class="log-${kind}">${msg}</div>`;
}

// ── Panel ──────────────────────────────────────────────────────────────────

export function renderBackupPanel(adb: Adb): HTMLElement {
  const panel = document.createElement("div");
  panel.style.cssText = "display:flex; flex-direction:column; height:100%; position:relative;";
  let files: BackupEntry[] = [];
  let abortController: AbortController | null = null;
  let isRunning = false;
  const selectedFileNames = new Set<string>();

  const SHAPE1 = `<svg class="hero-shape" width="271" height="271" viewBox="0 0 271 271" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M145.838 83.2831C161.501 4.55727 109.422 4.55727 125.084 83.2831C109.422 4.55727 61.3051 24.4835 105.901 91.2273C61.3051 24.4835 24.4835 61.305 91.2273 105.901C24.4835 61.305 4.5573 109.422 83.2832 125.074C4.5573 109.412 4.5573 161.491 83.2832 145.829C4.5573 161.491 24.4929 209.598 91.2273 165.002C24.4929 209.598 61.3145 246.42 105.901 179.676C61.3051 246.411 109.422 266.337 125.075 187.62C109.412 266.346 161.491 266.346 145.829 187.62C161.491 266.346 209.598 246.411 165.002 179.676C209.598 246.411 246.42 209.589 179.676 165.002C246.411 209.598 266.337 161.482 187.62 145.829C266.346 161.491 266.346 109.412 187.62 125.074C266.346 109.412 246.411 61.305 179.676 105.901C246.411 61.305 209.589 24.4835 165.002 91.2273C209.598 24.4929 161.482 4.56668 145.829 83.2831H145.838Z" fill="#39E968" fill-opacity="0.6"/></svg>`;
  const SHAPE2 = `<svg class="hero-shape" width="271" height="271" viewBox="0 0 271 271" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M95.1123 46.8733C107.635 37.7775 113.896 33.2295 120.569 30.9687C130.221 27.6986 140.682 27.6986 150.334 30.9687C157.008 33.2295 163.269 37.7775 175.791 46.8733L203.949 67.3268C211.386 72.7283 215.104 75.4291 218.135 78.6713C222.515 83.3571 225.876 88.9005 228.003 94.9511C229.475 99.1378 230.149 103.683 231.498 112.773L236.711 147.928C239.076 163.876 240.259 171.849 239.065 179.036C237.339 189.431 232.121 198.929 224.273 205.963C218.847 210.826 211.482 214.106 196.752 220.667L163.38 235.53C154.491 239.489 150.047 241.469 145.478 242.48C138.874 243.943 132.03 243.943 125.426 242.48C120.856 241.469 116.412 239.489 107.523 235.53L74.1512 220.667C59.4215 214.106 52.0566 210.826 46.6308 205.963C38.7822 198.929 33.5648 189.431 31.8383 179.036C30.6448 171.849 31.8273 163.876 34.1923 147.928L39.4058 112.773C40.7539 103.683 41.4279 99.1378 42.9002 94.9511C45.0278 88.9005 48.388 83.3571 52.7684 78.6713C55.7993 75.4291 59.5175 72.7283 66.9539 67.3268L95.1123 46.8733Z" fill="#39E968" fill-opacity="0.6"/></svg>`;
  const SHAPE3 = `<svg class="hero-shape" width="271" height="271" viewBox="0 0 271 271" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M216.099 54.7956C207.634 46.3302 188.345 50.5161 165.071 63.9341C158.101 37.9874 147.421 21.3871 135.449 21.3871C123.477 21.3871 112.798 37.9864 105.828 63.9317C82.5555 50.515 63.2676 46.3298 54.8026 54.7948C46.3367 63.2607 50.5236 82.5516 63.9436 105.828C37.9915 112.797 21.3872 123.478 21.3872 135.452C21.3872 147.423 37.9857 158.103 63.9299 165.072C50.5089 188.349 46.3214 207.641 54.7876 216.107C63.2542 224.574 82.5475 220.386 105.826 206.963C112.795 232.913 123.476 249.516 135.449 249.516C147.423 249.516 158.104 232.912 165.073 206.961C188.353 220.384 207.647 224.573 216.114 216.107C224.58 207.641 220.393 188.349 206.973 165.072C232.918 158.103 249.516 147.424 249.516 135.452C249.516 123.478 232.912 112.797 206.959 105.828C220.378 82.5518 224.565 63.2614 216.099 54.7956Z" fill="#39E968" fill-opacity="0.6"/></svg>`;
  const SHAPE4 = `<svg class="hero-shape" width="271" height="271" viewBox="0 0 271 271" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M176.403 218.491C164.4 234.199 158.399 242.052 151.468 245.63C141.428 250.812 129.476 250.812 119.436 245.63C112.505 242.052 106.504 234.199 94.5014 218.491L54.6415 166.326C47.3413 156.772 43.6912 151.995 41.8837 146.881C39.2692 139.483 39.2692 131.421 41.8837 124.023C43.6912 118.908 47.3413 114.131 54.6415 104.577L94.5014 52.4123C106.504 36.7048 112.505 28.851 119.436 25.2737C129.476 20.0916 141.428 20.0916 151.468 25.2737C158.399 28.851 164.4 36.7048 176.403 52.4123L216.262 104.577C223.563 114.131 227.213 118.908 229.02 124.023C231.635 131.421 231.635 139.483 229.02 146.881C227.213 151.995 223.563 156.772 216.262 166.326L176.403 218.491Z" fill="#39E968" fill-opacity="0.6"/></svg>`;

  const ICON1 = `<svg class="hero-icon" width="82" height="82" viewBox="0 0 82 82" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_64_779" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="82" height="82"><rect width="81.754" height="81.754" fill="#D9D9D9"/></mask><g mask="url(#mask0_64_779)"><path d="M13.6258 74.9411C11.7523 74.9411 10.1484 74.2741 8.81426 72.9399C7.48008 71.6057 6.81299 70.0018 6.81299 68.1283V17.032C6.81299 15.1585 7.48008 13.5547 8.81426 12.2205C10.1484 10.8863 11.7523 10.2192 13.6258 10.2192H17.0322V6.81279C17.0322 5.84764 17.3587 5.03861 18.0116 4.38572C18.6645 3.73282 19.4735 3.40637 20.4387 3.40637H34.0643C35.0295 3.40637 35.8385 3.73282 36.4914 4.38572C37.1443 5.03861 37.4707 5.84764 37.4707 6.81279V10.2192H40.8772C42.7507 10.2192 44.3546 10.8863 45.6887 12.2205C47.0229 13.5547 47.69 15.1585 47.69 17.032H74.9413V68.1283H47.69C47.69 70.0018 47.0229 71.6057 45.6887 72.9399C44.3546 74.2741 42.7507 74.9411 40.8772 74.9411H13.6258ZM13.6258 68.1283H40.8772V61.3155H68.1285V23.8449H40.8772V17.032H13.6258V68.1283ZM30.6579 57.9091H37.4707V51.0962H30.6579V57.9091ZM30.6579 34.0641H37.4707V27.2513H30.6579V34.0641ZM44.2836 57.9091H51.0964V51.0962H44.2836V57.9091ZM44.2836 34.0641H51.0964V27.2513H44.2836V34.0641ZM57.9093 57.9091H64.7221V51.0962H57.9093V57.9091ZM57.9093 34.0641H64.7221V27.2513H57.9093V34.0641Z" fill="#074335"/></g></svg>`;
  const ICON2 = `<svg class="hero-icon" width="82" height="82" viewBox="0 0 82 82" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_64_770" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="82" height="82"><rect width="81.754" height="81.754" fill="#D9D9D9"/></mask><g mask="url(#mask0_64_770)"><path d="M30.6581 37.4706H37.4709V23.845H30.6581V37.4706ZM40.8773 37.4706H47.6902V23.845H40.8773V37.4706ZM51.0966 37.4706H57.9094V23.845H51.0966V37.4706ZM20.4388 74.9412C18.5653 74.9412 16.9614 74.2741 15.6272 72.94C14.2931 71.6058 13.626 70.0019 13.626 68.1284V27.2514L34.0645 6.81287H61.3158C63.1894 6.81287 64.7932 7.47996 66.1274 8.81414C67.4616 10.1483 68.1287 11.7522 68.1287 13.6257V68.1284C68.1287 70.0019 67.4616 71.6058 66.1274 72.94C64.7932 74.2741 63.1894 74.9412 61.3158 74.9412H20.4388ZM20.4388 68.1284H61.3158V13.6257H36.9599L20.4388 30.1468V68.1284Z" fill="#074335"/></g></svg>`;
  const ICON3 = `<svg class="hero-icon" width="85" height="85" viewBox="0 0 85 85" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_64_752" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="85" height="85"><rect width="84.9419" height="84.9419" fill="#D9D9D9"/></mask><g mask="url(#mask0_64_752)"><path d="M17.6962 74.3241C15.7496 74.3241 14.0832 73.631 12.697 72.2448C11.3108 70.8586 10.6177 69.1922 10.6177 67.2456V17.6962C10.6177 15.7496 11.3108 14.0832 12.697 12.697C14.0832 11.3108 15.7496 10.6177 17.6962 10.6177H67.2456C69.1922 10.6177 70.8586 11.3108 72.2448 12.697C73.631 14.0832 74.3241 15.7496 74.3241 17.6962V67.2456C74.3241 69.1922 73.631 70.8586 72.2448 72.2448C70.8586 73.631 69.1922 74.3241 67.2456 74.3241H17.6962ZM17.6962 67.2456H67.2456V17.6962H17.6962V67.2456ZM21.2354 60.1671H63.7063L50.4342 42.4709L39.8164 56.6279L31.8531 46.0101L21.2354 60.1671ZM33.844 33.844C34.8762 32.8117 35.3924 31.5582 35.3924 30.0835C35.3924 28.6088 34.8762 27.3554 33.844 26.3231C32.8117 25.2908 31.5582 24.7747 30.0835 24.7747C28.6088 24.7747 27.3554 25.2908 26.3231 26.3231C25.2908 27.3554 24.7747 28.6088 24.7747 30.0835C24.7747 31.5582 25.2908 32.8117 26.3231 33.844C27.3554 34.8762 28.6088 35.3924 30.0835 35.3924C31.5582 35.3924 32.8117 34.8762 33.844 33.844Z" fill="#074335"/></g></svg>`;
  const ICON4 = `<svg class="hero-icon" width="75" height="75" viewBox="0 0 75 75" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_64_785" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="75" height="75"><rect width="74.3365" height="74.3365" fill="#D9D9D9"/></mask><g mask="url(#mask0_64_785)"><path d="M27.8766 9.29206V3.09735H46.4607V9.29206H27.8766ZM37.1687 68.1418C33.297 68.1418 29.6705 67.4062 26.2892 65.9349C22.9079 64.4637 19.9525 62.4633 17.423 59.9338C14.8935 57.4043 12.9061 54.4489 11.4606 51.0676C10.0152 47.6863 9.29248 44.0857 9.29248 40.2656C9.29248 36.4455 10.0281 32.8449 11.4993 29.4636C12.9706 26.0823 14.971 23.1269 17.5005 20.5974C20.03 18.0679 22.9854 16.0675 26.3666 14.5963C29.7479 13.125 33.3486 12.3894 37.1687 12.3894C40.4209 12.3894 43.5182 12.9314 46.4607 14.0155C49.4032 15.0996 52.0876 16.6225 54.5138 18.5841L59.005 14.093L63.3413 18.4293L59.005 22.9204C60.8634 25.3467 62.3347 28.031 63.4187 30.9735C64.5028 33.916 65.0448 37.0134 65.0448 40.2656C65.0448 44.0857 64.3221 47.6863 62.8767 51.0676C61.4313 54.4489 59.4438 57.4043 56.9143 59.9338C54.3848 62.4633 51.4294 64.4637 48.0481 65.9349C44.6668 67.4062 41.0404 68.1418 37.1687 68.1418ZM37.1687 34.0709H57.9209C56.9917 30.8703 55.4043 28.0569 53.1588 25.6306C50.9132 23.2043 48.2675 21.3717 45.2218 20.1328L37.1687 34.0709ZM31.7483 37.1682L42.1244 19.2036C39.0787 18.4293 35.9426 18.3647 32.7162 19.01C29.4898 19.6553 26.4828 21.062 23.6952 23.2302L31.7483 37.1682ZM15.7969 43.3629H31.7483L21.3722 25.3983C19.204 27.8246 17.5908 30.5735 16.5325 33.645C15.4743 36.7165 15.2291 39.9559 15.7969 43.3629ZM29.1155 60.3984L37.1687 46.4603H16.4164C17.3456 49.6609 18.933 52.4743 21.1786 54.9006C23.4242 57.3269 26.0698 59.1595 29.1155 60.3984ZM32.2129 61.3276C35.62 62.2052 38.9238 62.2439 42.1244 61.4437C45.325 60.6436 48.1643 59.2627 50.6422 57.301L42.589 43.3629L32.2129 61.3276ZM52.9652 55.1329C55.2366 52.655 56.8756 49.8803 57.8822 46.8088C58.8889 43.7372 59.1083 40.5237 58.5404 37.1682H42.589L52.9652 55.1329Z" fill="#074335"/></g></svg>`;

  panel.innerHTML = `
      <div class="card-header" style="align-items: center; position:absolute; top:0; left:0; right:0; z-index:10; padding:24px;">
        <div class="card-title">
          <svg class="ct-icon" viewBox="0 0 26 27" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.66006 10.875C6.16941 10.875 5.69885 11.0725 5.35191 11.4242C5.00497 11.7758 4.81006 12.2527 4.81006 12.75C4.81006 13.2473 5.00497 13.7242 5.35191 14.0758C5.69885 14.4275 6.16941 14.625 6.67486 14.625H6.66006Z" fill="currentColor"/><path d="M5.92 3.375C5.92 2.47989 6.27084 1.62145 6.89534 0.988515C7.51983 0.355579 8.36683 0 9.25 0H22.57C23.4532 0 24.3002 0.355579 24.9247 0.988515C25.5492 1.62145 25.9 2.47989 25.9 3.375V16.875C25.9 17.7701 25.5492 18.6286 24.9247 19.2615C24.3002 19.8944 23.4532 20.25 22.57 20.25H19.98V22.875C19.98 23.7701 19.6292 24.6286 19.0047 25.2615C18.3802 25.8944 17.5332 26.25 16.65 26.25H3.33C2.44683 26.25 1.59983 25.8944 0.975335 25.2615C0.350839 24.6286 0 23.7701 0 22.875V9.375C0 8.47989 0.350839 7.62145 0.975335 6.98851C1.59983 6.35558 2.44683 6 3.33 6H5.92V3.375ZM17.76 9.375C17.76 9.07663 17.6431 8.79048 17.4349 8.57951C17.2267 8.36853 16.9444 8.25 16.65 8.25H3.33C3.03561 8.25 2.75328 8.36853 2.54511 8.57951C2.33695 8.79048 2.22 9.07663 2.22 9.375V19.788L10.6086 15.381C11.2178 15.0606 11.9097 14.9388 12.5898 15.0323C13.2698 15.1257 13.9048 15.4298 14.4078 15.903L17.76 19.059V9.375ZM2.22 22.875C2.22 23.496 2.71728 24 3.33 24H16.65C16.9444 24 17.2267 23.8815 17.4349 23.6705C17.6431 23.4595 17.76 23.1734 17.76 22.875V22.1295L12.8967 17.553C12.7293 17.3952 12.5179 17.2937 12.2914 17.2623C12.0649 17.2309 11.8344 17.2711 11.6313 17.3775L2.22 22.323V22.875ZM8.14 6H16.65C17.5332 6 18.3802 6.35558 19.0047 6.98851C19.6292 7.62145 19.98 8.47989 19.98 9.375V18H22.57C22.8644 18 23.1467 17.8815 23.3549 17.6705C23.5631 17.4595 23.68 17.1734 23.68 16.875V3.375C23.68 3.07663 23.5631 2.79048 23.3549 2.5795C23.1467 2.36853 22.8644 2.25 22.57 2.25H9.25C8.95561 2.25 8.67328 2.36853 8.46511 2.5795C8.25695 2.79048 8.14 3.07663 8.14 3.375V6Z" fill="currentColor"/></svg>
          Media Backup
        </div>
        <div class="backup-header-actions">
          <button id="btn-reload-backup" class="btn-m3-reload" title="Reload / Scan">
            <svg class="reload-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            <span>Reload</span>
          </button>
        </div>
      </div>

      <div class="card-body" style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:0; overflow:hidden; position:relative; width:100%; height:100%;">
        
        <!-- Background shapes that persist and slide to the sides -->
        <div class="backup-hero-graphics" id="backup-graphics">
           <div class="hero-graphic-item item-1">
              ${SHAPE1}
              ${ICON1}
           </div>
           <div class="hero-graphic-item item-2">
              ${SHAPE2}
              ${ICON2}
           </div>
           <div class="hero-graphic-item item-3">
              ${SHAPE3}
              ${ICON3}
           </div>
           <div class="hero-graphic-item item-4">
              ${SHAPE4}
              ${ICON4}
           </div>
        </div>

        <!-- Initial overlay text and scan button -->
        <div class="backup-hero-overlay" id="backup-hero-overlay">
          <div class="backup-hero-text">
            Scan your device to list files available for backup
          </div>
          <div class="backup-hero-action">
            <button class="btn-m3-scan" id="btn-scan">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
              Scan
            </button>
          </div>
        </div>

        <!-- Content section shown after scan -->
        <div id="backup-content" style="display:none; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%; position:relative; z-index:5;">
          
          <!-- Dialog box (Rectangle 15) -->
          <div class="backup-dialog-box" id="backup-dialog-box">
            <!-- Header (Rectangle 16) -->
            <div class="backup-dialog-header">
              <div class="backup-header-left">
                <span class="backup-file-count-badge" id="backup-selected-count">0</span>
                <span class="backup-header-title">Files</span>
              </div>
              <div class="backup-header-right">
                <label class="custom-checkbox-wrapper select-all-wrapper">
                  <input type="checkbox" id="chk-select-all" class="real-checkbox" checked />
                  <span class="state-layer">
                    <span class="checkbox-container">
                      <svg class="check-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6 L4.5 8.5 L9.5 3" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <!-- Progress bar inside dialog -->
            <div class="apk-progress" id="backup-progress" style="display:none; flex-direction:column; gap:8px; padding: 16px 24px; background: #F0EFEF; border-bottom: 1px solid rgba(0, 0, 0, 0.05); box-sizing:border-box;">
              <div class="apk-progress-label" style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted);">
                <span id="backup-progress-msg">Starting…</span>
                <span id="backup-progress-pct">0%</span>
              </div>
              <md-linear-progress id="backup-progress-fill" value="0" style="width:100%;"></md-linear-progress>
            </div>

            <!-- File list container -->
            <div class="backup-file-list" id="backup-file-list"></div>

            <!-- Log output inside dialog at the bottom -->
            <div class="backup-log" id="backup-log" style="display:none; border-top: 1px solid rgba(0, 0, 0, 0.05); max-height: 100px; background: #F0EFEF; padding: 12px 24px; box-sizing:border-box; overflow-y:auto;">
              <div class="log-info">Ready.</div>
            </div>
          </div>

          <!-- Bottom Centered Action Buttons -->
          <div class="backup-footer-actions" style="margin-top:24px; display:flex; justify-content:center; gap:16px; width:100%;">
            <button class="btn-export" id="btn-backup" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <polyline points="19 12 12 19 5 12"/>
              </svg>
              Export
            </button>
            <button class="btn-cancel" id="btn-cancel" style="display:none;">
              Cancel
            </button>
          </div>
        </div>
      </div>
  `;

  const scanBtn     = panel.querySelector<any>("#btn-scan")!;
  const reloadBtn   = panel.querySelector<any>("#btn-reload-backup")!;
  const backupBtn   = panel.querySelector<any>("#btn-backup")!;
  const cancelBtn   = panel.querySelector<any>("#btn-cancel")!;
  const progressEl  = panel.querySelector<HTMLElement>("#backup-progress")!;
  const progressMsg = panel.querySelector<HTMLElement>("#backup-progress-msg")!;
  const progressPct = panel.querySelector<HTMLElement>("#backup-progress-pct")!;
  const progressFill = panel.querySelector<any>("#backup-progress-fill")!;
  const fileListEl  = panel.querySelector<HTMLElement>("#backup-file-list")!;
  const logEl       = panel.querySelector<HTMLElement>("#backup-log")!;
  const contentEl   = panel.querySelector<HTMLElement>("#backup-content")!;
  const cardBodyEl  = panel.querySelector<HTMLElement>(".card-body")!;
  const selectAllChk = panel.querySelector<HTMLInputElement>("#chk-select-all")!;

  function addLog(msg: string, kind: "ok" | "err" | "info"): void {
    logEl.style.display = "block";
    logEl.innerHTML += logLine(msg, kind);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function updateSelectionUI(): void {
    const totalSelected = selectedFileNames.size;
    const selectedCountEl = panel.querySelector<HTMLElement>("#backup-selected-count");
    if (selectedCountEl) {
      selectedCountEl.textContent = String(totalSelected);
    }
    
    selectAllChk.checked = totalSelected === files.length && files.length > 0;
    backupBtn.disabled = totalSelected === 0 || isRunning;
  }

  function setCheckboxesDisabled(disabled: boolean): void {
    const checkboxes = panel.querySelectorAll<HTMLInputElement>(".real-checkbox");
    checkboxes.forEach(chk => {
      chk.disabled = disabled;
    });
    panel.querySelectorAll<HTMLElement>(".custom-checkbox-wrapper").forEach(wrapper => {
      wrapper.style.pointerEvents = disabled ? "none" : "";
      wrapper.style.opacity = disabled ? "0.5" : "";
    });
  }

  function renderFileList(): void {
    if (files.length === 0) {
      fileListEl.style.display = "none";
      return;
    }
    fileListEl.style.display = "block";
    
    // Select all by default
    selectedFileNames.clear();
    files.forEach(f => selectedFileNames.add(f.name));

    fileListEl.innerHTML = files.map((f) => `
      <div class="backup-file-item" data-file="${f.name}">
        <div class="backup-file-item-left">
          <div class="file-icon-circle">
            ${fileIcon(f.name)}
          </div>
          <div class="backup-file-name-container">
            <span class="backup-file-name" title="${f.name}">${f.name}</span>
            <div class="backup-file-meta">
              <span class="backup-file-size">${formatBytes(f.size)}</span>
              <span class="backup-file-status" id="fstatus-${f.name.replace(/[^a-zA-Z0-9]/g, "_")}">
                <span class="badge badge-cyan">Queued</span>
              </span>
            </div>
          </div>
        </div>
        <div class="backup-file-item-right">
          <label class="custom-checkbox-wrapper file-checkbox-wrapper">
            <input type="checkbox" class="real-checkbox file-checkbox" data-file="${f.name}" checked />
            <span class="state-layer">
              <span class="checkbox-container">
                <svg class="check-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6 L4.5 8.5 L9.5 3" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </span>
          </label>
        </div>
      </div>
    `).join("");

    updateSelectionUI();

    // Attach individual checkbox change listeners
    const checkboxes = fileListEl.querySelectorAll<HTMLInputElement>(".file-checkbox");
    checkboxes.forEach((chk) => {
      chk.addEventListener("change", () => {
        const name = chk.getAttribute("data-file");
        if (!name) return;
        if (chk.checked) {
          selectedFileNames.add(name);
        } else {
          selectedFileNames.delete(name);
        }
        updateSelectionUI();
      });
    });
  }

  function setFileStatus(name: string, html: string): void {
    const id = `fstatus-${name.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const el = fileListEl.querySelector<HTMLElement>(`#${id}`);
    if (el) el.innerHTML = html;
  }

  // ── Scan ─────────────────────────────────────────────────────────────
  async function scanFiles(): Promise<void> {
    scanBtn.disabled = true;
    reloadBtn.disabled = true;
    backupBtn.disabled = true;
    
    // Add scanned class to trigger slide transitions
    cardBodyEl.classList.add("scanned");

    // Hide overlay
    const overlay = panel.querySelector<HTMLElement>("#backup-hero-overlay")!;
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => {
      overlay.style.display = "none";
    }, 400);

    contentEl.style.display = "flex";
    logEl.innerHTML = "";
    logEl.style.display = "none";
    progressEl.style.display = "none";

    // Show loading spinner inside file list area
    fileListEl.style.display = "block";
    fileListEl.innerHTML = `
      <div class="backup-loading-state">
        <svg class="spinner-stroke" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2B2B2B" stroke-width="3" stroke-linecap="round">
          <circle cx="12" cy="12" r="9" stroke-dasharray="40 10"/>
        </svg>
        <span>Scanning device for files…</span>
      </div>
    `;

    try {
      files = await listMediaFiles(adb);
      renderFileList();
    } catch (err) {
      toast(`Scan failed: ${String(err)}`, "error");
      addLog(`Scan error: ${String(err)}`, "err");
      fileListEl.innerHTML = `
        <div class="backup-error-state">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#BA1A1A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>Scan failed: ${String(err)}</span>
        </div>
      `;
    } finally {
      scanBtn.disabled = false;
      reloadBtn.disabled = false;
    }
  }

  // ── Backup ───────────────────────────────────────────────────────────
  async function startBackup(): Promise<void> {
    const selectedFiles = files.filter(f => selectedFileNames.has(f.name));
    if (isRunning || selectedFiles.length === 0) return;

    isRunning = true;
    setCheckboxesDisabled(true);
    abortController = new AbortController();
    backupBtn.style.display = "none";
    cancelBtn.style.display = "";
    reloadBtn.disabled = true;
    progressEl.style.display = "flex";

    logEl.innerHTML = "";
    addLog(`Starting backup of ${selectedFiles.length} file(s)…`, "info");

    // Reset statuses of selected files
    selectedFiles.forEach((f) => {
      setFileStatus(f.name, `<span class="badge badge-cyan">Queued</span>`);
    });

    const onProgress = (p: BackupProgress) => {
      progressMsg.textContent = p.message;
      const pct = p.total > 0 ? Math.round((p.current / p.total) * 100) : 0;
      progressPct.textContent = `${pct}%`;
      if (progressFill) {
        progressFill.value = pct / 100;
      }

      if (p.phase === "downloading" && p.fileName) {
        setFileStatus(p.fileName, `<span class="badge badge-amber">Downloading</span>`);
      }

      p.savedFiles.forEach((f) => {
        if (f.status === "ok") {
          setFileStatus(f.name, `<span class="badge badge-green">Saved</span>`);
          addLog(`✓ ${f.name} (${formatBytes(f.size)})`, "ok");
        } else if (f.status === "error") {
          setFileStatus(f.name, `<span class="badge badge-red">Error</span>`);
          addLog(`✗ ${f.name}: ${f.message}`, "err");
        }
      });
    };

    try {
      await backupMediaFiles(adb, selectedFiles, onProgress, abortController.signal);
      addLog("Backup complete.", "info");
    } catch (err) {
      toast(`Backup error: ${String(err)}`, "error");
      addLog(`Error: ${String(err)}`, "err");
    } finally {
      isRunning = false;
      setCheckboxesDisabled(false);
      abortController = null;
      backupBtn.style.display = "";
      cancelBtn.style.display = "none";
      reloadBtn.disabled = false;
    }
  }

  // ── Select All Listener ──────────────────────────────────────────────
  selectAllChk.addEventListener("change", () => {
    const isChecked = selectAllChk.checked;
    const checkboxes = fileListEl.querySelectorAll<HTMLInputElement>(".file-checkbox");
    
    if (isChecked) {
      files.forEach(f => selectedFileNames.add(f.name));
      checkboxes.forEach(chk => chk.checked = true);
    } else {
      selectedFileNames.clear();
      checkboxes.forEach(chk => chk.checked = false);
    }
    updateSelectionUI();
  });

  scanBtn.addEventListener("click", scanFiles);
  reloadBtn.addEventListener("click", scanFiles);
  backupBtn.addEventListener("click", startBackup);
  cancelBtn.addEventListener("click", () => {
    abortController?.abort();
    addLog("Backup cancelled by user.", "info");
    cancelBtn.style.display = "none";
    backupBtn.style.display = "";
  });

  return panel;
}
