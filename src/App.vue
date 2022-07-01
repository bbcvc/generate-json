<script setup>
import VueJsonPretty from 'vue-json-pretty'
import {init} from './components/index.js'
import {ref} from 'vue'

const dataView = ref()

const handleChange = ($event) => {
  var file = $event.target.files[0];
  var reader = new FileReader();
  reader.onload = function(event) {
    // 文件里的文本会在这里被打印出来
    
    dataView.value = init(event.target.result)

    console.log(dataView)
  };

  reader.readAsText(file);
}
</script>

<template>
  <input
    type="file"
    @change="handleChange"
  >
  <VueJsonPretty :data="dataView" />
</template>

<style>
 @import 'vue-json-pretty/lib/styles.css';
</style>
