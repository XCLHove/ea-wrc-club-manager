<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useShowLoginStore } from "@/stores/useShowLoginStore.ts";
import { FormInstance, FormRules } from "element-plus";
import { accessTokenUtil } from "@/utils/accessTokenUtil.ts";
import { refreshTokenUtil } from "@/utils/refreshTokenUtil.ts";

const { showLogin } = storeToRefs(useShowLoginStore());

const formData = ref({
  accessToken: "",
  refreshToken: "",
});
const formRules = ref<FormRules<typeof formData>>({
  accessToken: [
    { required: true, message: "请输入access_token", trigger: "blur" },
  ],
  refreshToken: [
    { required: true, message: "请输入refresh_token", trigger: "blur" },
  ],
});
const formRef = ref<FormInstance>();

const submitForm = () => {
  formRef.value?.validate((valid) => {
    if (!valid) {
      return false;
    }

    accessTokenUtil.set(formData.value.accessToken);
    refreshTokenUtil.set(formData.value.refreshToken);

    useShowLoginStore().hide();
  });
};

const clearForm = () => {};
</script>

<template>
  <el-dialog v-model="showLogin" title="设置令牌">
    <el-form ref="formRef" :model="formData" :rules="formRules">
      <el-form-item prop="accessToken" label="access_token">
        <el-input
          v-model="formData.accessToken"
          placeholder="access_token"
        ></el-input>
      </el-form-item>
      <el-form-item prop="refreshToken" label="refresh_token">
        <el-input
          v-model="formData.refreshToken"
          placeholder="refresh_token"
        ></el-input>
      </el-form-item>
      <el-form-item>
        <div class="form-operation">
          <el-button type="danger" @click="clearForm">清空</el-button>
          <el-button type="primary" @click="submitForm">提交</el-button>
        </div>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<style scoped lang="less">
.form-operation {
  display: flex;
  width: 100%;
  .el-button {
    margin: 0 auto;
    width: 45%;
  }
  .el-button:first-child {
    margin-left: 0;
  }
  .el-button:last-child {
    margin-right: 0;
  }
}
</style>
