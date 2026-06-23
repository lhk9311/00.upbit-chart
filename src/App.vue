<template>
  <div class="container-fluid app-container">

    <h1 class="main-title">
      실시간 리스트
    </h1>

    <div class="row g-3">

      <!-- 코인 목록 -->
      <div class="col-lg-6">
        <CoinList @selectCoin="selectCoin" />
      </div>

      <!-- 차트 -->
      <div class="col-lg-6">
        <div class="chart-card">

          <h3>
            {{
              selectedCoin
                ? `${selectedCoin.korean_name} (${selectedCoin.market})`
                : '차트 영역'
            }}
          </h3>

          <!-- 기간 버튼 -->
          <div class="chart-buttons">

            <button @click="changePeriod('realtime')">
              실시간
            </button>
            <button @click="changePeriod(1)">1분</button>
            <button @click="changePeriod(3)">3분</button>
            <button @click="changePeriod(5)">5분</button>
            <button @click="changePeriod(10)">10분</button>
            <button @click="changePeriod(15)">15분</button>
            <button @click="changePeriod(30)">30분</button>

            <button @click="changePeriod(60)">
              1시간
            </button>

            <button @click="changePeriod(240)">
              4시간
            </button>

            <button @click="changePeriod('day')">
              하루
            </button>

            <button @click="changePeriod('week')">
              주간
            </button>

            <button @click="changePeriod('month')">
              월간
            </button>

          </div>

          <div class="chart-body">

            <CoinChart
              :chartData="chartData"
            />

          </div>

        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

// 웹소켓
let socket = null;

// 현재 캔들
let currentCandle = null;

// 현재 분
let currentMinute = null;

import CoinList from './components/CoinList.vue';
import CoinChart from './components/CoinChart.vue';

// 선택된 코인
const selectedCoin = ref(null);

// 차트 종류
const currentPeriod = ref('day');

// 차트 데이터
const chartData = ref([]);

// 웹소켓
const websocket = ref(null);

// 코인 클릭
const selectCoin = async (coin) => {

  selectedCoin.value = coin;

  console.log('선택된 코인', coin);

  if (
    currentPeriod.value === 'realtime'
  ) {

    chartData.value = [];

    currentCandle = null;
    currentMinute = null;

    startRealtime(
      coin.market
    );

    return;
  }

  await loadChart(
    coin.market
  );
};

// 기간 변경
const changePeriod = async (period) => {

  currentPeriod.value = period;

  if (!selectedCoin.value) {
    return;
  }

  // 실시간
  if (period === 'realtime') {

    currentPeriod.value = 1;

    await loadChart(
      selectedCoin.value.market
    );

    currentCandle = null;
    currentMinute = null;

    startRealtime(
      selectedCoin.value.market
    );

    return;
  }
  
  // 일반 차트 선택 시 웹소켓 종료
  if (socket) {
    socket.close();
  }

  await loadChart(
    selectedCoin.value.market
  );
};

// 차트 조회
const loadChart = async (market) => {

  try {

    let url = '';

    // 분봉
    if (typeof currentPeriod.value === 'number') {

      url =
        `https://api.upbit.com/v1/candles/minutes/${currentPeriod.value}`;

    }

    // 일봉
    else if (currentPeriod.value === 'day') {

      url =
        'https://api.upbit.com/v1/candles/days';

    }

    // 주봉
    else if (currentPeriod.value === 'week') {

      url =
        'https://api.upbit.com/v1/candles/weeks';

    }

    // 월봉
    else if (currentPeriod.value === 'month') {

      url =
        'https://api.upbit.com/v1/candles/months';

    }

    const res = await axios.get(
      url,
      {
        params: {
          market,
          count: 50
        }
      }
    );

  console.log('URL');
  console.log(url);

  console.log('응답');
  console.log(res.data);

  console.log(Array.isArray(res.data));

    const candles = res.data.reverse();

    console.log('캔들 원본');
    console.log(candles);

    console.log('캔들 변환');

    const convertedData = candles.map(candle => ({
      x: new Date(
        candle.candle_date_time_kst
      ).getTime(),
      y: [
        candle.opening_price,
        candle.high_price,
        candle.low_price,
        candle.trade_price
      ]
    }));

    console.log('차트데이터 전체');
    console.log(chartData.value);

    console.log('첫번째');
    console.log(chartData.value[0]);

    console.log(convertedData);

    chartData.value = convertedData;

    // 차트 데이터 구성
    chartData.value = candles.map(candle => ({

      x: new Date(
        candle.candle_date_time_kst
      ),

      y: [

        candle.opening_price, // 시가

        candle.high_price, // 고가

        candle.low_price, // 저가

        candle.trade_price // 종가

      ]

    }));

    
  }
  catch (err) {

    console.error(err);

  }
};



// 실시간 차트(웹소켓)
const startRealtime = (market) => {

console.log('웹소켓 시작', market);

if (socket) {
socket.close();
}

socket = new WebSocket(
'wss://api.upbit.com/websocket/v1'
);

socket.onopen = () => {

console.log('웹소켓 연결 성공');

socket.send(
  JSON.stringify([
    {
      ticket: 'test'
    },
    {
      type: 'ticker',
      codes: [market]
    }
  ])
);

};

// 웹소켓
socket.onmessage = async (event) => {

  console.log('실시간 데이터 수신');

    const buffer =
      await event.data.arrayBuffer();

    const text =
      new TextDecoder('utf-8')
        .decode(buffer);

    const data =
      JSON.parse(text);

    const price =
      data.trade_price;

    const now =
      new Date();

    const minuteKey =
      `${now.getHours()}:${now.getMinutes()}`;

    console.log('minuteKey', minuteKey);

    // 최초 캔들 생성
    if (!currentCandle) {

      console.log('최초 캔들 생성');

      currentMinute = minuteKey;

      currentCandle = {

        x: now,

        y: [
          price, // 시가
          price, // 고가
          price, // 저가
          price  // 종가
        ]

      };

      chartData.value.push(
        currentCandle
      );

      chartData.value = [
        ...chartData.value
      ];

      return;
    }

    // 같은 분
    if (currentMinute === minuteKey) {

      currentCandle.y[1] =
        Math.max(
          currentCandle.y[1],
          price
        );

      currentCandle.y[2] =
        Math.min(
          currentCandle.y[2],
          price
        );

      currentCandle.y[3] =
        price;

      chartData.value = [
        ...chartData.value
      ];

      console.log('현재캔들', currentCandle);
      console.log('종가', currentCandle.y[3]);
    }

    // 새로운 분
    else {

      console.log('새 분 생성');

      currentMinute = minuteKey;

      currentCandle = {

        x: now,

        y: [
          price,
          price,
          price,
          price
        ]

      };

      chartData.value.push(
        currentCandle
      );

      // 최근 50개 유지
      if (
        chartData.value.length > 50
      ) {

        chartData.value.shift();

      }

      chartData.value = [
        ...chartData.value
      ];

    }

  };

};

</script>

<style>
body {
  background-color: #0d1117;
  color: white;
  margin: 0;
}

#app {
  background-color: #0d1117;
  min-height: 100vh;
}

.app-container {
  padding: 30px;
}

.main-title {
  text-align: center;
  margin-bottom: 30px;
  color: white;
}

.chart-card {
  background-color: #161b22;
  border-radius: 12px;
  padding: 20px;
  height: 700px;
  color: white;
}

.chart-card h3 {
  text-align: center;
}

.chart-body {
  height: 500px;
}

.chart-buttons {
  display: flex;
  flex-wrap: wrap;

  gap: 8px;

  margin-bottom: 15px;

  justify-content: center;
}

.chart-buttons button {
  border: none;

  background: #30363d;

  color: white;

  padding: 6px 12px;

  border-radius: 6px;

  cursor: pointer;
}

.chart-buttons button:hover {
  background: #3b82f6;
}
</style>