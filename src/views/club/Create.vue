<script setup lang="ts">
import { createClub, createClubValidate } from "@/api/clubApi.ts";
import { AccessLevel, accessLevels } from "@/interfaces/Club.ts";
import { Platform, platforms } from "@/interfaces/Platform.ts";
import { ref } from "vue";
import { ElMessage, FormInstance, FormRules } from "element-plus";
import { AxiosError } from "axios";
import { debounce } from "@/utils/debounce/debounce.ts";

const formData = ref({
  name: "",
  description: "",
  imageCatalogueID: 1,
  accessLevel: AccessLevel.OPEN,
  platform: Platform.CROSS_PLATFORM,
  officialClubType: 0,
  discordServerUrl: "",
  twitchChannelUrl: "",
  youtubeChannelUrl: "",
});
const formRef = ref<FormInstance>();
const validateName = (() => {
  const messageMap = new Map<string, string>();
  const callbackErrorMessage = (
    value: string,
    message: string,
    callback: any,
  ) => {
    messageMap.set(value, message);
    callback(new Error(message));
  };
  const _createClubValidate = debounce((value: string, callback: any) => {
    createClubValidate("name", value)
      .then(() => {
        callback();
      })
      .catch((error: AxiosError) => {
        callbackErrorMessage(value, error.response.data, callback);
      });
  }, 0.5);

  return (_: any, value: string, callback: any) => {
    let message = messageMap.get(value);
    if (message) {
      callback(new Error(message));
      return;
    }

    if (!value || value.length < 3) {
      callbackErrorMessage(value, "俱乐部名称至少3个字符", callback);
      return;
    }

    _createClubValidate(value, callback);
  };
})();
const validateDescription = (() => {
  const messageMap = new Map<string, string>();
  const callbackErrorMessage = (
    value: string,
    message: string,
    callback: any,
  ) => {
    messageMap.set(value, message);
    callback(new Error(message));
  };
  const _createClubValidate = debounce((value: string, callback: any) => {
    createClubValidate("description", value)
      .then(() => {
        callback();
      })
      .catch((error: AxiosError) => {
        callbackErrorMessage(value, error.response.data, callback);
      });
  }, 0.5);

  return (_: any, value: string, callback: any) => {
    if (!value) {
      callback();
      return;
    }
    console.log(value);

    let message = messageMap.get(value);
    if (message) {
      callback(new Error(message));
      return;
    }

    _createClubValidate(value, callback);
  };
})();
const formRules = ref<FormRules<typeof formData>>({
  name: [{ validator: validateName, trigger: "blur" }],
  description: [{ validator: validateDescription, trigger: "blur" }],
});

const create = () => {
  formRef.value?.validate((valid) => {
    if (!valid) {
      return;
    }

    createClub(formData.value)
      .then(() => {
        ElMessage({
          message: "创建成功",
          type: "success",
        });
      })
      .then(() => {
        if (autoReset.value) {
          resetFields();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  });
};

const autoReset = ref(true);
const resetFields = () => {
  formRef.value?.resetFields();
};
</script>

<template>
  <div class="create-container">
    <el-form
      :model="formData"
      label-width="95px"
      ref="formRef"
      :rules="formRules"
      status-icon
    >
      <el-form-item prop="name" label="俱乐部名称">
        <el-input placeholder="俱乐部名称" v-model="formData.name" />
      </el-form-item>
      <el-form-item label="俱乐部介绍">
        <el-input
          type="textarea"
          rows="1"
          placeholder="俱乐部介绍"
          v-model="formData.description"
        />
      </el-form-item>
      <el-form-item prop="platform" label="平台">
        <el-select v-model="formData.platform">
          <el-option
            v-for="platform in platforms"
            :key="platform.value"
            :label="platform.description"
            :value="platform.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item prop="accessLevel" label="访问权限">
        <el-select v-model="formData.accessLevel">
          <el-option
            v-for="accessLevel in accessLevels"
            :key="accessLevel.value"
            :label="accessLevel.description"
            :value="accessLevel.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item prop="discordServerUrl" label="Discord">
        <el-input
          placeholder="discord link"
          v-model="formData.discordServerUrl"
        />
      </el-form-item>
      <el-form-item prop="twitchChannelUrl" label="Twitch">
        <el-input
          placeholder="twitch link"
          v-model="formData.twitchChannelUrl"
        />
      </el-form-item>
      <el-form-item prop="youtubeChannelUrl" label="YouTube">
        <el-input
          placeholder="youtube link"
          v-model="formData.youtubeChannelUrl"
        />
      </el-form-item>
      <el-form-item label="自动清空">
        <el-checkbox v-model="autoReset" />
      </el-form-item>
      <div class="button-container">
        <el-button type="danger" @click="resetFields">清空</el-button>
        <el-button type="primary" @click="create">创建</el-button>
      </div>
    </el-form>
  </div>
</template>

<style lang="less" scoped>
.create-container {
  .el-form {
    .button-container {
      display: flex;

      .el-button {
        width: 50%;
      }
    }
  }
}
</style>
