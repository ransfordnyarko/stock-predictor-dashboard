// src/App.js
import React, {useState, useEffect} from 'react';
import { Card, CardContent, Typography, Box, Grid, Divider, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_URL = 'http://localhost:5000/predict'; // Replace with your actual API URL

// Initial stock symbols
const stockSymbols = ['AAPL', 'CRWD', 'RTX', 'GCF', 'GSPC'];


const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
  },
};

const liveUserData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  datasets: [
    {
      label: "This week's predictions",
      data: [80, 85, 78, 90, 95, 88, 92],
      borderColor: 'rgba(54, 162, 235, 1)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      tension: 0.3,
    },
  ],
};

const liveUserOptions = {
  responsive: true,
  maintainAspectRatio: false,
};

const StockCard = ({ predictedPrice, actualPrice , date}) => {
  const difference = predictedPrice - actualPrice;
  const percentageDifference = ((difference / actualPrice) * 100).toFixed(2);
  const isPositive = difference > 0;

  return (
    <Card sx={{ width: '100%', textAlign: 'center', boxShadow: 2, padding: 1 }}>
      <CardContent>
        <Box display="flex" justifyContent="center" alignItems="center" mb={1}>
          {isPositive ? (
            <ArrowCircleUpIcon sx={{ color: 'green', fontSize: 30, transform: 'rotate(30deg)' }} />
          ) : (
            <ArrowCircleDownIcon sx={{ color: 'red', fontSize: 30, transform: 'rotate(30deg)' }} />
          )}
        </Box>
        <Typography color="text.secondary">
          {date}
        </Typography>
        <Typography variant="h5" component="div">
          ${predictedPrice}
        </Typography>
        <Typography color="text.secondary">
          Actual Price: ${actualPrice}
        </Typography>
        <Typography sx={{ color: isPositive ? 'green' : 'red', fontWeight: 'bold' }}>
          {isPositive ? `+${percentageDifference}%` : `${percentageDifference}%`}
        </Typography>
      </CardContent>
    </Card>
  );
};

function App() {
  const [selectedStock, setSelectedStock] = useState(stockSymbols[0]);
  const [stockData, setStockData] = useState([]);
  const [graphData, setGraphData] = useState({ labels: [], datasets: [] });
  const [currentPrediction, setCurrentPrediction] = useState('')
  const [currentDay, setCurrentDay] = useState('')
  const [weeklyGraphData, setWeeklyGraphData] = useState({ labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], datasets: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}?model_name=${selectedStock}`);
        const data = await response.json();

        const predictions = data.predictions;
        const actualPrices = data.actual_prices;
        const nextPrediction = data.extra_day_prediction.price
        const day = data.extra_day_prediction.date

  
        setCurrentPrediction(nextPrediction)
        setCurrentDay(day)

        setStockData(predictions.map((predictedPrice, index) => ({
          predictedPrice,
          actualPrice: actualPrices[index] || predictedPrice, 
          date: data.dates[index]
        })));

        setGraphData({
          labels: data.dates.slice(0,4),
          datasets: [
            {
              label: 'Predicted Prices',
              data: predictions,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
            },
            {
              label: 'Actual Prices',
              data: actualPrices,
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
            },
          ],
        });

        prepareWeeklyData(data.dates, data.actual_prices, data.extra_day_prediction)
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [selectedStock]);

  function setToMonday( date ) {
    date.setUTCHours(0,0,0,0)
    var day = date.getDay() || 7;  
    if( day !== 1 ) 
        date.setHours(-24 * (day - 1)); 
    return date;
}

  const prepareWeeklyData = (dates, predictions, extraDayPrediction) => {
    const today = setToMonday(new Date());

  
    let filteredDates = [];
    let filteredPredictions = [];

  
    for (let i = 0; i < dates.length; i++) {
      const date = new Date(dates[i]);
    
      if (date >= today) {
        filteredDates.push(dates[i]);
        filteredPredictions.push(predictions[i]);
      }
    }

    // Add the extra day prediction
    filteredDates.push(extraDayPrediction.date);
    filteredPredictions.push(extraDayPrediction.price);

    setWeeklyGraphData({
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      datasets: [
        {
          label: 'This Week’s trend',
          data: filteredPredictions,
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
        },
      ],
    });
  };

  return (
    <Box display="flex" flexDirection="column" p={4} gap={10}>
       <FormControl fullWidth sx={{ maxWidth: 175}}>
        <InputLabel>Select Stock</InputLabel>
        <Select value={selectedStock} label="Select Stock" onChange={(e) => setSelectedStock(e.target.value)}>
          {stockSymbols.map((symbol) => (
            <MenuItem key={symbol} value={symbol}>
              {symbol}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {/* Graph and Cards */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4}>
        {/* Graph on the Left */}
        <Box flex={2} sx={{ height: { xs: '300px', md: '400px' } }}>
          <Typography variant="h5" mb={2}>
            Predicted Prices vs Actual Prices
          </Typography>
          <Box sx={{ height: '100%' }}>
            <Line data={graphData} options={options} />
          </Box>
        </Box>

        {/* Cards on the Right in 2x2 Grid */}
        <Box flex={2}>
          <Grid container spacing={3}>
            {stockData.map((data, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <StockCard predictedPrice={data.predictedPrice} actualPrice={data.actualPrice} date={data.date}/>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* Additional Components Beneath the Graph and Cards */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4}>
        {/* Current Live Users Card with Graph */}
        <Card sx={{ flex: 1, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Current Prediction
            </Typography>
            <Typography variant="h3">{currentPrediction}</Typography>
            <Typography color="text.secondary" mb={2}>
              Today's Date: {currentDay}
            </Typography>
            <Divider />
            <Box sx={{ height: '100%', mt: 2 }}>
              <Line data={weeklyGraphData} options={liveUserOptions} />
            </Box>

          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default App;
