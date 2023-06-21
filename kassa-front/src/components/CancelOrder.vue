<template>
  <div class="container">

    <button
      class="custom-button"
      @click.stop="clicked"
    >
      <span>Tühista viimane tellimus</span>
    </button>
  </div>
</template>

<script>
export default {
  methods: {
    clicked() {
      this.$emit("myClick");
    }
  }
};
</script>

<style>
.custom-button {
  background-color: indianred;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.custom-button:hover {
  background-color: darkred;
}
</style>
