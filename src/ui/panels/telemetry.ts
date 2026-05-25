import type { Adb } from "@yume-chan/adb";
import { fetchDeviceInfo, fetchBattery, fetchSystemDetails } from "../../adb/telemetry.js";
import { state } from "../../state.js";
import { toast } from "../toast.js";

// ── SVGs ────────────────────────────────────────────────────────────────────

const SVG_BRAND = `<svg width="32" height="28" viewBox="0 0 32 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.9165 26.2468C5.0415 22.1223 6.45817 16.6229 6.45817 8.37386H16.3748C16.3748 16.6229 17.7915 22.1223 19.9165 26.2468M15.6665 3.23883C17.324 0.988215 19.4461 0.988215 21.1036 3.23883C22.1038 4.61917 23.3958 4.5683 24.4201 3.18796C26.0535 0.937346 28.1742 0.937346 29.8331 3.18796" stroke="#095F4C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M16.8708 13.9707H21.9056C22.104 16.4977 21.8858 20.9068 26.5679 25.9992M1.5 26.2467H28.4166" stroke="#095F4C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const SVG_MODEL = `<svg width="21" height="28" viewBox="0 0 21 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.0625 0H17.9375C19.628 0 21 1.372 21 3.0625V24.9375C21 25.7497 20.6773 26.5287 20.103 27.103C19.5287 27.6773 18.7497 28 17.9375 28H3.0625C2.25027 28 1.47132 27.6773 0.896986 27.103C0.322655 26.5287 0 25.7497 0 24.9375V3.0625C0 1.372 1.372 0 3.0625 0ZM2.625 3.0625V24.9375C2.625 25.179 2.821 25.375 3.0625 25.375H17.9375C18.0535 25.375 18.1648 25.3289 18.2469 25.2469C18.3289 25.1648 18.375 25.0535 18.375 24.9375V3.0625C18.375 2.94647 18.3289 2.83519 18.2469 2.75314C18.1648 2.67109 18.0535 2.625 17.9375 2.625H3.0625C2.94647 2.625 2.83519 2.67109 2.75314 2.75314C2.67109 2.83519 2.625 2.94647 2.625 3.0625ZM10.5 22.75C10.0359 22.75 9.59075 22.5656 9.26256 22.2374C8.93437 21.9092 8.75 21.4641 8.75 21C8.75 20.5359 8.93437 20.0908 9.26256 19.7626C9.59075 19.4344 10.0359 19.25 10.5 19.25C10.9641 19.25 11.4092 19.4344 11.7374 19.7626C12.0656 20.0908 12.25 20.5359 12.25 21C12.25 21.4641 12.0656 21.9092 11.7374 22.2374C11.4092 22.5656 10.9641 22.75 10.5 22.75Z" fill="#095F4C"/>
</svg>`;

const SVG_ANDROID = `<svg width="23" height="27" viewBox="0 0 23 27" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.3333 0.0174083C13.2175 0.0174083 14.994 0.476408 16.5566 1.29099L17.4151 0.432492C17.5458 0.297185 17.7021 0.189261 17.8749 0.115015C18.0478 0.0407686 18.2337 0.00168806 18.4218 5.34887e-05C18.6099 -0.00158108 18.7964 0.034263 18.9705 0.105494C19.1446 0.176726 19.3028 0.281917 19.4358 0.414932C19.5688 0.547947 19.674 0.70612 19.7453 0.880223C19.8165 1.05433 19.8523 1.24087 19.8507 1.42898C19.8491 1.61708 19.81 1.80298 19.7357 1.97581C19.6615 2.14865 19.5536 2.30497 19.4183 2.43566L18.9224 2.93149C20.1027 3.99326 21.0461 5.29173 21.6912 6.74233C22.3364 8.19294 22.6687 9.76315 22.6667 11.3507V22.6841C22.6667 23.8112 22.2189 24.8923 21.4219 25.6893C20.6248 26.4863 19.5438 26.9341 18.4167 26.9341H4.25001C3.12284 26.9341 2.04183 26.4863 1.2448 25.6893C0.447773 24.8923 6.27115e-06 23.8112 6.27115e-06 22.6841V11.3507C-0.0016657 9.76329 0.331008 8.19328 0.976369 6.74292C1.62173 5.29257 2.56531 3.99439 3.74567 2.93291L3.24842 2.43708C2.9826 2.17144 2.83319 1.81108 2.83305 1.43528C2.83324 1.05948 2.98208 0.699024 3.24771 0.4332C3.51335 0.167376 3.87371 0.0179626 4.24951 0.0178298C4.62531 0.0176969 4.98577 0.166855 5.25159 0.432492L6.11009 1.29099C7.72382 0.453666 9.51531 0.0168483 11.3333 0.0174083ZM19.8333 15.6007H2.83334V22.6841C2.83334 23.0598 2.9826 23.4201 3.24827 23.6858C3.51395 23.9515 3.87428 24.1007 4.25001 24.1007H18.4167C18.7924 24.1007 19.1527 23.9515 19.4184 23.6858C19.6841 23.4201 19.8333 23.0598 19.8333 22.6841V15.6007ZM11.3333 2.85074C9.13413 2.85066 7.02049 3.70296 5.4365 5.22857C3.85251 6.75417 2.92148 8.83433 2.83901 11.032L2.83334 11.3507V12.7674H19.8333V11.3507C19.8333 9.0964 18.9378 6.93439 17.3437 5.34033C15.7497 3.74627 13.5877 2.85074 11.3333 2.85074ZM7.08334 7.10074C7.45906 7.10074 7.8194 7.25 8.08507 7.51567C8.35075 7.78135 8.50001 8.14168 8.50001 8.51741C8.50001 8.89313 8.35075 9.25347 8.08507 9.51914C7.8194 9.78482 7.45906 9.93407 7.08334 9.93407C6.70762 9.93407 6.34728 9.78482 6.0816 9.51914C5.81593 9.25347 5.66667 8.89313 5.66667 8.51741C5.66667 8.14168 5.81593 7.78135 6.0816 7.51567C6.34728 7.25 6.70762 7.10074 7.08334 7.10074ZM15.5833 7.10074C15.9591 7.10074 16.3194 7.25 16.5851 7.51567C16.8508 7.78135 17 8.14168 17 8.51741C17 8.89313 16.8508 9.25347 16.5851 9.51914C16.3194 9.78482 15.9591 9.93407 15.5833 9.93407C15.2076 9.93407 14.8473 9.78482 14.5816 9.51914C14.3159 9.25347 14.1667 8.89313 14.1667 8.51741C14.1667 8.14168 14.3159 7.78135 14.5816 7.51567C14.8473 7.25 15.2076 7.10074 15.5833 7.10074Z" fill="#095F4C"/>
</svg>`;

const SVG_MODEL_NUMBER = `<svg width="26" height="25" viewBox="0 0 26 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M24.5 9.18753H19.7094L20.5417 4.61018C20.6041 4.2676 20.5278 3.91427 20.3297 3.62793C20.1315 3.34158 19.8277 3.14568 19.4852 3.08331C19.1426 3.02094 18.7892 3.09722 18.5029 3.29536C18.2166 3.49351 18.0206 3.79729 17.9583 4.13987L17.0406 9.18753H12.7094L13.5417 4.61018C13.5726 4.44055 13.5698 4.2665 13.5334 4.09796C13.497 3.92943 13.4278 3.76971 13.3297 3.62793C13.2316 3.48614 13.1065 3.36507 12.9616 3.27163C12.8167 3.17818 12.6548 3.11419 12.4852 3.08331C12.3155 3.05243 12.1415 3.05526 11.9729 3.09164C11.8044 3.12803 11.6447 3.19725 11.5029 3.29536C11.3611 3.39347 11.24 3.51855 11.1466 3.66345C11.0532 3.80835 10.9892 3.97024 10.9583 4.13987L10.0406 9.18753H5.25C4.9019 9.18753 4.56806 9.32581 4.32192 9.57195C4.07578 9.81809 3.9375 10.1519 3.9375 10.5C3.9375 10.8481 4.07578 11.182 4.32192 11.4281C4.56806 11.6742 4.9019 11.8125 5.25 11.8125H9.56375L8.76859 16.1875H3.5C3.1519 16.1875 2.81806 16.3258 2.57192 16.572C2.32578 16.8181 2.1875 17.1519 2.1875 17.5C2.1875 17.8481 2.32578 18.182 2.57192 18.4281C2.81806 18.6742 3.1519 18.8125 3.5 18.8125H8.29063L7.45828 23.3899C7.4267 23.5598 7.42901 23.7343 7.46507 23.9034C7.50113 24.0725 7.57023 24.2327 7.66841 24.375C7.76658 24.5173 7.89189 24.6388 8.03715 24.7325C8.18241 24.8262 8.34475 24.8903 8.51484 24.9211C8.59254 24.934 8.67127 24.9395 8.75 24.9375C9.05736 24.9373 9.35489 24.8293 9.59075 24.6322C9.8266 24.4351 9.98581 24.1615 10.0406 23.8591L10.9594 18.8125H15.2906L14.4583 23.3899C14.4267 23.5598 14.429 23.7343 14.4651 23.9034C14.5011 24.0725 14.5702 24.2327 14.6684 24.375C14.7666 24.5173 14.8919 24.6388 15.0371 24.7325C15.1824 24.8262 15.3447 24.8903 15.5148 24.9211C15.5927 24.9359 15.6718 24.9432 15.7511 24.943C16.0584 24.9428 16.356 24.8347 16.5918 24.6377C16.8277 24.4406 16.9869 24.167 17.0417 23.8646L17.9594 18.8125H22.75C23.0981 18.8125 23.4319 18.6742 23.6781 18.4281C23.9242 18.182 24.0625 17.8481 24.0625 17.5C24.0625 17.1519 23.9242 16.8181 23.6781 16.572C23.4319 16.3258 23.0981 16.1875 22.75 16.1875H18.4362L19.2314 11.8125H24.5C24.8481 11.8125 25.1819 11.6742 25.4281 11.4281C25.6742 11.182 25.8125 10.8481 25.8125 10.5C25.8125 10.1519 25.6742 9.81809 25.4281 9.57195C25.1819 9.32581 24.8481 9.18753 24.5 9.18753ZM15.7686 16.1875H11.4362L12.2314 11.8125H16.5638L15.7686 16.1875Z" fill="#095F4C"/>
</svg>`;

const SVG_CODENAME = `<svg width="27" height="32" viewBox="0 0 27 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17 26.9308L17.0142 26.9152" stroke="#095F4C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M25.5 25.5V30.3166C25.5 30.4283 25.478 30.5388 25.4353 30.6419C25.3926 30.7451 25.33 30.8388 25.251 30.9177C25.1721 30.9966 25.0784 31.0592 24.9753 31.1019C24.8722 31.1447 24.7616 31.1666 24.65 31.1666H9.35C9.23838 31.1666 9.12785 31.1447 9.02472 31.1019C8.92159 31.0592 8.82789 30.9966 8.74896 30.9177C8.67003 30.8388 8.60742 30.7451 8.5647 30.6419C8.52199 30.5388 8.5 30.4283 8.5 30.3166V25.5M25.5 8.49998V3.68331C25.5 3.45788 25.4104 3.24168 25.251 3.08227C25.0916 2.92287 24.8754 2.83331 24.65 2.83331H9.35C9.12457 2.83331 8.90837 2.92287 8.74896 3.08227C8.58955 3.24168 8.5 3.45788 8.5 3.68331V8.49998" stroke="#095F4C" stroke-width="2.5" stroke-linecap="round"/>
<path d="M21.9583 12.0416L26.9166 17L21.9583 21.9583M12.0416 12.0416L7.08325 17L12.0416 21.9583" stroke="#095F4C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const SVG_RESOLUTION = `<svg width="26" height="23" viewBox="0 0 26 23" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21.0214 1.25H5.07671C2.96328 1.25 1.25 2.96328 1.25 5.07671V17.1946C1.25 19.3081 2.96328 21.0214 5.07671 21.0214H21.0214C23.1348 21.0214 24.8481 19.3081 24.8481 17.1946V5.07671C24.8481 2.96328 23.1348 1.25 21.0214 1.25Z" stroke="#095F4C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6.35229 11.4546V6.35229H11.4546M19.7458 10.8168V15.9191H14.6435" stroke="#095F4C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const SVG_SCREEN_DPI = `<svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.3225 0.583945L14.3775 0L8.04375 9.91605L1.72125 19.8321L2.6775 20.4161L3.6225 21L9.95625 11.0839L16.2787 1.16789L15.3225 0.583945ZM0 4.44019C0 6.56663 1.76625 8.29643 3.9375 8.29643C6.10875 8.29643 7.875 6.56663 7.875 4.44019C7.875 2.31375 6.10875 0.583945 3.9375 0.583945C1.76625 0.583945 0 2.31375 0 4.44019ZM3.9375 2.78751C4.87125 2.78751 5.625 3.52571 5.625 4.44019C5.625 5.35467 4.87125 6.09286 3.9375 6.09286C3.00375 6.09286 2.25 5.35467 2.25 4.44019C2.25 3.52571 3.00375 2.78751 3.9375 2.78751ZM10.125 16.5598C10.125 18.6863 11.8913 20.4161 14.0625 20.4161C16.2337 20.4161 18 18.6863 18 16.5598C18 14.4334 16.2337 12.7036 14.0625 12.7036C11.8913 12.7036 10.125 14.4334 10.125 16.5598ZM15.75 16.5598C15.75 17.4743 14.9963 18.2125 14.0625 18.2125C13.1287 18.2125 12.375 17.4743 12.375 16.5598C12.375 15.6453 13.1287 14.9071 14.0625 14.9071C14.9963 14.9071 15.75 15.6453 15.75 16.5598Z" fill="#095F4C"/>
</svg>`;

const SVG_TEMPERATURE = `<svg width="16" height="30" viewBox="0 0 16 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.31236 19.4727V6.13635C9.31236 5.77469 9.17222 5.42784 8.92278 5.17211C8.67334 4.91638 8.33502 4.77271 7.98226 4.77271C7.62949 4.77271 7.29118 4.91638 7.04174 5.17211C6.79229 5.42784 6.65216 5.77469 6.65216 6.13635V19.4727C6.2501 19.7106 5.91579 20.0523 5.68245 20.4638C5.44911 20.8753 5.32486 21.3422 5.32206 21.8181C5.32206 22.5414 5.60233 23.2351 6.10121 23.7466C6.6001 24.258 7.27673 24.5454 7.98226 24.5454C8.68779 24.5454 9.36442 24.258 9.8633 23.7466C10.3622 23.2351 10.6425 22.5414 10.6425 21.8181C10.6397 21.3422 10.5154 20.8753 10.2821 20.4638C10.0487 20.0523 9.71441 19.7106 9.31236 19.4727ZM13.9677 16.3636V6.13635C13.9677 4.50889 13.3371 2.94808 12.2146 1.79729C11.0921 0.646506 9.5697 0 7.98226 0C6.39482 0 4.8724 0.646506 3.74991 1.79729C2.62742 2.94808 1.99681 4.50889 1.99681 6.13635V16.3636C1.0775 17.4316 0.446083 18.7271 0.165013 20.1221C-0.116058 21.517 -0.0370418 22.963 0.394245 24.3171C0.825532 25.6711 1.59415 26.8862 2.62406 27.8423C3.65397 28.7983 4.90949 29.4621 6.26643 29.7681C6.83011 29.8998 7.40454 29.9774 7.98226 29.9999C9.52601 30.0073 11.0387 29.5555 12.337 28.6992C13.6354 27.8429 14.6636 26.619 15.2971 25.1757C15.9306 23.7324 16.1422 22.1318 15.9062 20.5677C15.6703 19.0036 14.9969 17.5432 13.9677 16.3636ZM11.3075 26.0045C10.6069 26.5884 9.77294 26.98 8.88403 27.1423C7.99512 27.3046 7.08054 27.2323 6.2264 26.9322C5.37226 26.6322 4.60665 26.1142 4.00167 25.427C3.39669 24.7399 2.97224 23.9062 2.76827 23.0045C2.56277 22.093 2.58942 21.1426 2.84565 20.2446C3.10188 19.3467 3.57908 18.5315 4.23138 17.8772C4.35706 17.7509 4.45704 17.6003 4.52553 17.4341C4.59403 17.2679 4.62968 17.0895 4.63041 16.909V6.13635C4.63041 5.2322 4.98074 4.36509 5.60435 3.72576C6.22795 3.08643 7.07374 2.72726 7.95566 2.72726C8.83757 2.72726 9.68336 3.08643 10.307 3.72576C10.9306 4.36509 11.2809 5.2322 11.2809 6.13635V16.9636C11.2816 17.144 11.3173 17.3225 11.3858 17.4887C11.4543 17.6549 11.5543 17.8055 11.6799 17.9318C12.2236 18.4702 12.6491 19.1213 12.9281 19.8416C13.2071 20.5619 13.3332 21.3348 13.298 22.109C13.2627 22.8831 13.067 23.6407 12.7238 24.3312C12.3805 25.0217 11.8977 25.6293 11.3075 26.1136V26.0045Z" fill="currentColor"/>
</svg>`;

const SVG_HEALTH = `<svg width="23" height="21" viewBox="0 0 23 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M21.0552 1.95502C22.6214 3.5294 23.2416 5.69456 22.9159 7.73683H20.5759C20.9271 6.257 20.5327 4.62853 19.3928 3.48262C17.7055 1.78654 15.0147 1.78654 13.3275 3.48262L11.5 5.31972L9.67248 3.48256C7.98526 1.78648 5.29442 1.78648 3.60721 3.48256C2.46725 4.62853 2.07287 6.257 2.42407 7.73683H0.0841081C-0.241594 5.69456 0.378652 3.52935 1.94474 1.95497C4.35063 -0.463489 8.14348 -0.638086 10.7495 1.43133C10.9551 1.59476 11.1506 1.76961 11.3349 1.95497L11.5 2.12091L11.665 1.95502C11.8522 1.7669 12.0477 1.59235 12.2504 1.43133C14.8565 -0.638086 18.6493 -0.46354 21.0552 1.95502ZM17.1138 12.1579H20.2959L11.5 21L2.70412 12.1579H5.88615L11.5 17.8012L17.1138 12.1579ZM8.05 3.05488L5.03815 8.84213H1.41425e-05V11.0526H6.46074L8.05 7.99769L11.5 14.6293L13.3607 11.0526H23V8.84213H14.5107L13.225 6.37067L11.5 9.68543L8.05 3.05488Z" fill="#095F4C"/>
</svg>`;

const SVG_BATTERY = `<svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21 4H1M21 4V19H1V4M21 4H17V1H21V4ZM1 4V1H5V4H1ZM4 8.5H7M15 8.5H18M5.5 7V10" stroke="#095F4C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const SVG_CPU = `<svg width="16" height="26" viewBox="0 0 16 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.363636 26L0 22.8222L4.14546 11.4833C4.50909 11.8204 4.90327 12.1035 5.328 12.3327C5.75273 12.5619 6.20703 12.7361 6.69091 12.8556L2.69091 23.7611L0.363636 26ZM15.6364 26L13.3091 23.7611L9.30909 12.8556C9.79394 12.7352 10.2487 12.5604 10.6735 12.3312C11.0982 12.102 11.4919 11.8194 11.8545 11.4833L16 22.8222L15.6364 26ZM4.90909 10.2917C4.06061 9.44907 3.63636 8.42593 3.63636 7.22222C3.63636 6.28333 3.90933 5.447 4.45527 4.71322C5.00121 3.97944 5.69794 3.46763 6.54545 3.17778V0H9.45455V3.17778C10.303 3.46667 11.0002 3.97848 11.5462 4.71322C12.0921 5.44796 12.3646 6.2843 12.3636 7.22222C12.3636 8.42593 11.9394 9.44907 11.0909 10.2917C10.2424 11.1343 9.21212 11.5556 8 11.5556C6.78788 11.5556 5.75758 11.1343 4.90909 10.2917ZM9.03709 8.25211C9.31539 7.97478 9.45455 7.63148 9.45455 7.22222C9.45455 6.81296 9.31491 6.47015 9.03564 6.19378C8.75636 5.91741 8.41115 5.77874 8 5.77778C7.58885 5.77681 7.24364 5.91548 6.96436 6.19378C6.68509 6.47207 6.54545 6.81489 6.54545 7.22222C6.54545 7.62956 6.68509 7.97285 6.96436 8.25211C7.24364 8.53137 7.58885 8.66956 8 8.66667C8.41115 8.66378 8.75685 8.52511 9.03709 8.25067" fill="#095F4C"/>
</svg>`;

const SVG_SDK_LEVEL = `<svg width="26" height="28" viewBox="0 0 26 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.4567 0.340507L24.9956 5.91156C26.5601 6.73783 26.5601 8.97887 24.9956 9.80367L23.1259 10.7928L24.9956 11.782C26.5601 12.6083 26.5601 14.8493 24.9956 15.6741L23.1259 16.6633L24.9956 17.6525C26.5601 18.4787 26.5601 20.7198 24.9956 21.5446L14.4567 27.1156C14.0339 27.3392 13.5628 27.4561 13.0845 27.4561C12.6062 27.4561 12.1351 27.3392 11.7123 27.1156L1.17336 21.5446C-0.391119 20.7183 -0.391119 18.4787 1.17336 17.6525L3.04456 16.6633L1.17336 15.6741C-0.391119 14.8479 -0.391119 12.6083 1.17336 11.782L3.04456 10.7928L1.17336 9.80367C-0.391119 8.97741 -0.391119 6.73783 1.17336 5.91156L11.7123 0.340507C12.1351 0.116893 12.6062 0 13.0845 0C13.5628 0 14.0339 0.116893 14.4567 0.340507ZM19.9852 18.3232L14.4567 21.2452C14.0339 21.4688 13.5628 21.5857 13.0845 21.5857C12.6062 21.5857 12.1351 21.4688 11.7123 21.2452L6.18379 18.3246L3.7725 19.5985L13.0845 24.5209L22.398 19.5985L19.9852 18.3232ZM19.9852 12.4527L14.4567 15.3762C14.0733 15.5787 13.6498 15.6937 13.2166 15.713C12.7835 15.7323 12.3514 15.6553 11.9515 15.4877L11.7123 15.3762L6.18379 12.4527L3.7725 13.7295L13.0845 18.649L22.398 13.7281L19.9852 12.4527ZM13.0845 2.93525L3.7725 7.85762L13.0845 12.78L22.398 7.85762L13.0845 2.93525Z" fill="#095F4C"/>
</svg>`;

const SVG_SECURITY_PATCH = `<svg width="28" height="34" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M28 15.4545C28 24.0318 22.0267 32.0527 14 34C5.97333 32.0527 0 24.0318 0 15.4545V6.18182L14 0L28 6.18182V15.4545ZM14 30.9091C19.8333 29.3636 24.8889 22.4709 24.8889 15.7945V8.19091L14 3.36909L3.11111 8.19091V15.7945C3.11111 22.4709 8.16667 29.3636 14 30.9091ZM18.3556 15.4545V13.1364C18.3556 10.9727 16.1778 9.27273 14 9.27273C11.8222 9.27273 9.64444 10.9727 9.64444 13.1364V15.4545C8.71111 15.4545 7.77778 16.3818 7.77778 17.3091V22.7182C7.77778 23.8 8.71111 24.7273 9.64444 24.7273H18.2C19.2889 24.7273 20.2222 23.8 20.2222 22.8727V17.4636C20.2222 16.3818 19.2889 15.4545 18.3556 15.4545ZM16.3333 15.4545H11.6667V13.1364C11.6667 11.9 12.7556 11.1273 14 11.1273C15.2444 11.1273 16.3333 11.9 16.3333 13.1364V15.4545Z" fill="#095F4C"/>
</svg>`;

// ── Template ───────────────────────────────────────────────────────────────

function renderSkeleton(): string {
  return `
    <!-- Column 1: System and Build -->
    <div class="telem-column col-grid-2">
      <div class="column-heading col-span-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        System and build
      </div>
      
      <div class="metric-tile-m3">
        <div class="metric-icon-badge">${SVG_BRAND}</div>
        <div class="metric-details">
          <span class="metric-label">BRAND</span>
          <span class="metric-value telemetry-skeleton" id="val-brand">—</span>
        </div>
      </div>
      
      <div class="metric-tile-m3">
        <div class="metric-icon-badge">${SVG_MODEL}</div>
        <div class="metric-details">
          <span class="metric-label">MODEL</span>
          <span class="metric-value telemetry-skeleton" id="val-model-marketing">—</span>
        </div>
      </div>

      <div class="metric-tile-m3 tall-card col-span-2">
        <div class="metric-icon-badge">${SVG_ANDROID}</div>
        <div class="metric-details">
          <span class="metric-label">ANDROID VERSION</span>
          <span class="metric-value telemetry-skeleton" id="val-sdk">—</span>
        </div>
      </div>

      <div class="metric-tile-m3">
        <div class="metric-icon-badge">${SVG_MODEL_NUMBER}</div>
        <div class="metric-details">
          <span class="metric-label">MODEL NUMBER</span>
          <span class="metric-value telemetry-skeleton" id="val-model-number">—</span>
        </div>
      </div>
      
      <div class="metric-tile-m3">
        <div class="metric-icon-badge">${SVG_CODENAME}</div>
        <div class="metric-details">
          <span class="metric-label">CODENAME</span>
          <span class="metric-value telemetry-skeleton" id="val-device-codename">—</span>
        </div>
      </div>
    </div>

    <!-- Column 2: Hardware & Display -->
    <div class="telem-column col-flex">
      <div class="column-heading">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        Hardware &amp; Display
      </div>

      <div class="metric-tile-m3 mem-card">
        <span class="metric-label mem-label">MEMORY</span>
        <div class="mem-container">
          <svg class="mem-bg-ring" viewBox="0 0 100 100">
            <path id="mem-ring-unfilled" fill="none" stroke="#E1E4DC" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
            <path id="mem-ring" fill="none" stroke="#095F4C" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="mem-overlay">
            <div class="mem-pct" id="mem-pct">0%</div>
            <div class="mem-avail" id="val-memory">—</div>
          </div>
        </div>
      </div>

      <div class="metric-tile-m3 wide-card">
        <div class="metric-icon-badge">${SVG_RESOLUTION}</div>
        <div class="metric-details">
          <span class="metric-label">RESOLUTION</span>
          <span class="metric-value telemetry-skeleton" id="val-screen">—</span>
        </div>
      </div>

      <div class="metric-tile-m3 wide-card">
        <div class="metric-icon-badge">${SVG_SCREEN_DPI}</div>
        <div class="metric-details">
          <span class="metric-label">SCREEN DPI</span>
          <span class="metric-value telemetry-skeleton" id="val-density">—</span>
        </div>
      </div>
    </div>

    <!-- Column 3: Battery & Diagnostics -->
    <div class="telem-column col-grid-2">
      <div class="column-heading col-span-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="10" x2="23" y2="14"/><line x1="7" y1="10" x2="7" y2="14"/><line x1="11" y1="10" x2="11" y2="14"/><line x1="15" y1="10" x2="15" y2="14"/></svg>
        System and build
      </div>

      <div class="metric-tile-m3">
        <div class="metric-icon-badge">${SVG_TEMPERATURE}</div>
        <div class="metric-details">
          <span class="metric-label">TEMPERATURE</span>
          <span class="metric-value telemetry-skeleton" id="val-temp">—</span>
        </div>
      </div>
      
      <div class="metric-tile-m3">
        <div class="metric-icon-badge">${SVG_HEALTH}</div>
        <div class="metric-details">
          <span class="metric-label">HEALTH</span>
          <span class="metric-value telemetry-skeleton" id="val-health">—</span>
        </div>
      </div>

      <div class="metric-tile-m3">
        <div class="metric-icon-badge">${SVG_BATTERY}</div>
        <div class="metric-details">
          <span class="metric-label">VOLTAGE</span>
          <span class="metric-value telemetry-skeleton" id="val-voltage">—</span>
        </div>
      </div>
      
      <div class="metric-tile-m3">
        <div class="metric-icon-badge">${SVG_BATTERY}</div>
        <div class="metric-details">
          <span class="metric-label">BATTERY TYPE</span>
          <span class="metric-value telemetry-skeleton" id="val-technology">—</span>
        </div>
      </div>

      <div class="metric-tile-m3">
        <div class="metric-icon-badge">${SVG_SDK_LEVEL}</div>
        <div class="metric-details">
          <span class="metric-label">SDK LEVEL</span>
          <span class="metric-value telemetry-skeleton" id="val-sdk-level">—</span>
        </div>
      </div>
      
      <div class="metric-tile-m3">
        <div class="metric-icon-badge">${SVG_CPU}</div>
        <div class="metric-details">
          <span class="metric-label">CPU</span>
          <span class="metric-value telemetry-skeleton" id="val-cpu-abi">—</span>
        </div>
      </div>

      <div class="metric-tile-m3 security-card">
        <div class="security-card-header">
          <div class="metric-icon-badge">${SVG_SECURITY_PATCH}</div>
          <div class="metric-details">
            <span class="metric-label">SECURITY PATCH</span>
          </div>
        </div>
        <div class="security-calendar-display telemetry-skeleton" id="sec-calendar">
          <span class="sec-day" id="sec-day">—</span>
          <span class="sec-month-weekday" id="sec-month-weekday">— —</span>
          <span class="sec-year" id="sec-year">—</span>
        </div>
      </div>
    </div>
  `;
}

// ── Panel ──────────────────────────────────────────────────────────────────

export function renderTelemetryPanel(adb: Adb): HTMLElement {
  // Wrapper holds both the scroll panel and the overlay pill
  const wrap = document.createElement("div");
  wrap.className = "telem-panel-wrap";

  const panel = document.createElement("div");
  panel.className = "telem-panel";
  wrap.appendChild(panel);

  // ── Custom scroll pill ──────────────────────────────────────────────────
  const PILL_H = 80; // px, must match CSS
  const scrollPill = document.createElement("div");
  scrollPill.className = "telem-scroll-pill";
  const scrollThumb = document.createElement("div");
  scrollThumb.className = "telem-scroll-thumb";
  scrollPill.appendChild(scrollThumb);
  wrap.appendChild(scrollPill);


  const refreshIconSvg = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;

  panel.innerHTML = `
    <div class="telem-header">
      <span class="telem-title">Device Info</span>
      <button class="btn-refresh-green" id="btn-refresh-telem">
        ${refreshIconSvg}
        <span class="btn-refresh-text">Reload</span>
      </button>
    </div>
    <div class="telem-body" id="telem-body">
      ${renderSkeleton()}
    </div>
  `;

  const body = panel.querySelector<HTMLElement>("#telem-body")!;
  const refreshBtn = panel.querySelector<HTMLButtonElement>("#btn-refresh-telem")!;

  // ── Data fetching ─────────────────────────────────────────────────────
  async function loadData(): Promise<void> {
    refreshBtn.disabled = true;
    const icon = refreshBtn.querySelector("svg")!;
    icon.classList.add("rotating");

    try {
      const info = state.device || await fetchDeviceInfo(adb);
      state.device = info;

      const [battery, sys] = await Promise.all([
        fetchBattery(adb),
        fetchSystemDetails(adb),
      ]);

      const q = (id: string) => body.querySelector<HTMLElement>(`#${id}`)!;
      q("val-brand").textContent           = info.brand;
      q("val-model-marketing").textContent = info.marketingName;
      q("val-model-number").textContent    = info.model;
      q("val-screen").textContent          = info.screenSize;
      q("val-sdk").textContent             = `Android ${info.osVersion}`;
      q("val-sdk-level").textContent        = sys.sdkVersion;
      
      // Parse security patch for calendar format
      let dayStr = "—";
      let monthWeekdayStr = "— —";
      let yearStr = "—";
      if (sys.securityPatch && sys.securityPatch !== "—") {
        const dateParts = sys.securityPatch.split('-');
        if (dateParts.length === 3) {
          const year = dateParts[0];
          const month = parseInt(dateParts[1], 10) - 1;
          const day = parseInt(dateParts[2], 10);
          const d = new Date(Date.UTC(parseInt(year, 10), month, day));
          const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
          const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
          dayStr = String(day).padStart(2, '0');
          monthWeekdayStr = `${months[month] || "—"} ${days[d.getUTCDay()] || "—"}`;
          yearStr = year;
        } else {
          dayStr = "??";
          monthWeekdayStr = sys.securityPatch;
          yearStr = "??";
        }
      }
      q("sec-day").textContent = dayStr;
      q("sec-month-weekday").textContent = monthWeekdayStr;
      q("sec-year").textContent = yearStr;

      q("val-device-codename").textContent    = sys.deviceName;
      q("val-density").textContent           = sys.densityDpi ? `${sys.densityDpi} dpi` : "—";
      q("val-cpu-abi").textContent            = sys.cpuAbi;
      const totalNum = parseFloat(sys.totalMemory);
      const availNum = parseFloat(sys.availMemory);
      const usedGb = (totalNum - availNum).toFixed(1);
      const usedPct = totalNum > 0 ? Math.round((1 - availNum / totalNum) * 100) : 0;
      q("val-memory").textContent = `${usedGb} GB / ${sys.totalMemory}`;

      const ring = body.querySelector<SVGPathElement>("#mem-ring")!;
      const ringUnfilled = body.querySelector<SVGPathElement>("#mem-ring-unfilled")!;
      const pctText = body.querySelector<HTMLElement>("#mem-pct")!;
      if (ring && ringUnfilled && pctText) {
        const CX = 50, CY = 50, R = 43, AMP = 3, FREQ = 20, N = 300, GAP = 2;
        const splitIdx = Math.floor(N * usedPct / 100);
        const filledStart = GAP;
        const filledEnd = Math.max(filledStart, Math.min(splitIdx - GAP, N - GAP));
        const unfilledStart = Math.max(splitIdx + GAP, GAP);
        const unfilledEnd = N - GAP;

        function pt(i: number, rad: number): string {
          const theta = (i / N) * 2 * Math.PI;
          return `${(CX + rad * Math.cos(theta)).toFixed(1)} ${(CY + rad * Math.sin(theta)).toFixed(1)}`;
        }

        // Build filled (sine wave) path from GAP to splitIdx - GAP
        const fPts: string[] = [];
        for (let i = filledStart; i <= filledEnd; i++) {
          const rad = R + AMP * 0.5 * (1 + Math.sin((i / N) * 2 * Math.PI * FREQ));
          fPts.push(`${i === filledStart ? 'M' : 'L'}${pt(i, rad)}`);
        }
        ring.setAttribute("d", fPts.join(''));

        // Build unfilled (circle) path from splitIdx + GAP to N - GAP
        const uPts: string[] = [];
        for (let i = unfilledStart; i <= unfilledEnd; i++) {
          uPts.push(`${i === unfilledStart ? 'M' : 'L'}${pt(i, R)}`);
        }
        ringUnfilled.setAttribute("d", uPts.join(''));

        pctText.textContent = `${usedPct}%`;
      }

      q("val-temp").textContent            = `${battery.tempCelsius.toFixed(1)}°C`;
      q("val-health").textContent           = battery.health;
      q("val-voltage").textContent           = battery.voltage || "—";
      q("val-technology").textContent        = battery.technology || "—";

      // Remove shimmer
      body.querySelectorAll<HTMLElement>(".telemetry-skeleton")
          .forEach((el) => el.classList.remove("telemetry-skeleton"));
      
      const cal = body.querySelector<HTMLElement>("#sec-calendar");
      if (cal) cal.classList.remove("telemetry-skeleton");

    } catch (err) {
      toast(`Telemetry error: ${String(err)}`, "error");
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.querySelector("svg")?.classList.remove("rotating");
    }
  }

  refreshBtn.addEventListener("click", loadData);

  // ── Scroll state: drives fade mask + custom pill thumb ─────────────────
  function updateScrollState() {
    const { scrollTop, scrollHeight, clientHeight } = panel;
    const canScrollTop    = scrollTop > 1;
    const canScrollBottom = scrollTop + clientHeight < scrollHeight - 1;
    const isScrollable    = canScrollTop || canScrollBottom;

    panel.classList.toggle("can-scroll-top",    canScrollTop);
    panel.classList.toggle("can-scroll-bottom", canScrollBottom);
    scrollPill.classList.toggle("pill-visible",  isScrollable);

    if (isScrollable && scrollHeight > clientHeight) {
      const thumbH   = Math.max(16, (clientHeight / scrollHeight) * PILL_H);
      const thumbTop = (scrollTop / (scrollHeight - clientHeight)) * (PILL_H - thumbH);
      scrollThumb.style.height = `${thumbH}px`;
      scrollThumb.style.top    = `${thumbTop}px`;
    }
  }

  panel.addEventListener("scroll", updateScrollState, { passive: true });

  const resizeObserver = new ResizeObserver(updateScrollState);
  resizeObserver.observe(panel);

  // ── Card click-to-copy ─────────────────────────────────────────────────
  body.addEventListener("click", (e) => {
    const tile = (e.target as HTMLElement).closest<HTMLElement>(".metric-tile-m3");
    if (!tile) return;

    const label = tile.querySelector(".metric-label")?.textContent?.trim() ?? "";
    // Regular tiles
    let value = tile.querySelector(".metric-value")?.textContent?.trim();
    // Memory card
    if (!value) value = tile.querySelector(".mem-pct")?.textContent?.trim();
    // Security card – join all calendar spans
    if (!value) {
      const day  = tile.querySelector(".sec-day")?.textContent?.trim();
      const mw   = tile.querySelector(".sec-month-weekday")?.textContent?.trim();
      const yr   = tile.querySelector(".sec-year")?.textContent?.trim();
      if (day || mw || yr) value = [mw, day, yr].filter(Boolean).join(" ");
    }

    if (!label || !value || value === "—") return;
    const text = `"${label}": "${value}"`;

    navigator.clipboard.writeText(text).then(() => {
      tile.classList.add("tile-copied");
      setTimeout(() => tile.classList.remove("tile-copied"), 1200);
    });
  });

  // Auto-load on mount
  setTimeout(() => {
    loadData().then(updateScrollState).catch(() => {});
  }, 80);

  return wrap;
}
