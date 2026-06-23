<template>
  <div class="chart-container">

    <apexchart
      type="candlestick"
      height="500"
      :options="chartOptions"
      :series="series"
    />

  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  chartData: {
    type: Array,
    default: () => []
  }
});

const series = computed(() => {

  console.log('=== CoinChart ===');

  console.log('전체 데이터');
  console.log(props.chartData);

  console.log('첫번째 데이터');
  console.log(
  JSON.stringify(
    props.chartData?.[0],
    null,
    2
  )
);

  return [
    {
      name: 'price',
      data: props.chartData
    }
  ];
});

const chartOptions = {
  chart: {
    type: 'candlestick',
    background: '#161b22',
    animations: {
      enabled: false
    }
  },

  theme: {
    mode: 'dark'
  },

  xaxis: {
    type: 'datetime'
  },

  yaxis: {
    forceNiceScale: false,

    labels: {
      formatter: function (value) {
        return Math.round(value).toLocaleString();
      }
    }
}
};
</script>