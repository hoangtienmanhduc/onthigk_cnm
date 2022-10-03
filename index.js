const express = require('express');
const app = express();
const multer = require('multer');
const upload = multer();



app.use(express.json({ extended: false }));
app.use(express.static('./views'));
app.set('view engine', 'ejs');
app.set('views', './views');

//config aws dynamodb
const AWS = require('aws-sdk');
const config = new AWS.Config({
    accessKeyId: 'AKIAQEPX75ALKG3AV2VJ',
    secretAccessKey: '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',
    region: 'us-west-1'
});
AWS.config = config;

const docClinet = new AWS.DynamoDB.DocumentClient();

const tableName = 'SanPham';

//Lấy dữ liệu lên
app.get('/', (request, response) => {
    const params = {
        TableName: tableName,
    };

    docClinet.scan(params, (err, data) => {
        if (err) {
            response.send('Internal Server Error');
        } else {
            return response.render('index', { sanPhams: data.Items.sort((a, b) => a.ma_sp - b.ma_sp) });
        }
    });
});

//Thêm dữ liệu
app.get('/add', (req, res) => {
    res.render('add')
})

const isIdExists = async(ma_sp) => {
    await docClinet.scan({ TableName: tableName }, (err, data) => {
      if (err) {
        console.log("error");
      } else {
        // console.log(!data.Items.filter((item) => item.ma_sp == ma_sp) === true);
        if (data.Items.filter((item) => item.ma_sp = ma_sp)) {
            return true;
        }
        return false;
    }
    });
  };

  
const validate = async(ma_sp, ten_sp, so_luong) => {
    const errors = [];
    //validate
    if (!ma_sp || !ten_sp || !so_luong) {
      errors.push({ msg: "Vui lòng điền đầy đủ thông tin vào ô trống" });
    }

    if (await isIdExists(ma_sp)) {
        errors.push({ msg: "trùng mã"});
    }

  
    if (parseInt(ma_sp) < 0) {
      errors.push({ msg: "Vui lòng nhập mã sản phẩm > 0" });
    }
  
    
    if (parseInt(so_luong) < 0) {
      errors.push({ msg: "Vui lòng nhập số lượng > 0" });
    }
  
    // if (!isbn.match("[0-9]{3}-[0-9]{3}-[0-9]{3}")) {
    //   errors.push({ msg: "isbn eror. ex: 111-222-333" });
    // }
    return errors;
  };

  

app.post('/them',upload.fields([]), async(req, res) => {
    const { ma_sp, ten_sp, so_luong } = req.body;
    const errors = await validate(ma_sp, ten_sp, so_luong);

  if (errors.length > 0) {
    console.log(errors)
    res.render("add", { errors });
  } else {

    const params = {
        TableName: tableName,
        Item: {
            ma_sp,
            ten_sp,
            so_luong,
        },
    };
    docClinet.put(params, (err, data) => {  
        if (err) {
            console.log(err);
        } else {
            return res.redirect("/");
        }
    })
    }   
});

//Xóa dữ liệu
app.post('/delete', upload.fields([]), (req, res) => {
    const { ma_sp } = req.body;
    const params = {
        TableName: tableName,
        Key: {
            ma_sp
        }
    };
docClinet.delete(params, (err, data) => {  
    if (err) {
        return res.send('Internal Server Error');
    } else {
        return res.redirect("/");
    }
})
});

//Post
app.listen(2000, () => {
    console.log('Server is running on port 2000!');
});