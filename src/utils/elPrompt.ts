import { ElMessage } from "element-plus";

const ElMessageFunction = (
  message: string,
  type: "info" | "success" | "warning" | "error",
  durationSecond: number = 1,
  showClose = true,
) => {
  ElMessage({
    showClose: showClose,
    duration: durationSecond * 1000,
    message: message,
    type: type,
  });
};

export const elPrompt = {
  success: (message: string, durationSecond: number = 1, showClose = true) => {
    ElMessageFunction(message, "success", durationSecond, showClose);
  },
  error: (message: string, durationSecond: number = 1, showClose = true) => {
    ElMessageFunction(message, "error", durationSecond, showClose);
  },
  warning: (message: string, durationSecond: number = 1, showClose = true) => {
    ElMessageFunction(message, "warning", durationSecond, showClose);
  },
  info: (message: string, durationSecond: number = 1, showClose = true) => {
    ElMessageFunction(message, "info", durationSecond, showClose);
  },
};
