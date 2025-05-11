<script setup lang="ts">
import { ref } from "vue";
import { router } from "@/router/router";
import { FormInstance } from "element-plus";

const formData = ref({
  clubId: "",
});
const formRules = ref({
  clubId: [{ required: true, message: "请输入俱乐部ID", trigger: "blur" }],
});
const formRef = ref<FormInstance>();

const inputText = ref("");
const parseClubId = () => {
  let text = inputText.value.replace(/^.*clubs\/(\d+).*/, "$1");
  formData.value.clubId = /\d+/.exec(text)?.[0] || "";
};

const viewClub = () => {
  formRef.value?.validate().then((valid) => {
    if (!valid) {
      return;
    }

    router.push(`/club/detail/${formData.value.clubId}`);
  });
};
</script>

<template>
  <div class="join-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80"
    >
      <el-form-item label="url">
        <el-input
          placeholder="输入url以提取俱乐部ID"
          v-model="inputText"
          @input="parseClubId"
        ></el-input>
      </el-form-item>

      <el-form-item prop="clubId" label="俱乐部ID">
        <el-input
          placeholder="请输入俱乐部ID"
          v-model="formData.clubId"
        ></el-input>
      </el-form-item>
      <el-button style="width: 100%" type="success" @click="viewClub"
        >查看</el-button
      >
    </el-form>
  </div>
</template>

<style scoped lang="less"></style>
