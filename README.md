1. download libraries
npm i express nodemon ejs multel aws-sdk
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">

2. init app
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
3. Lấy dữ liệu lên 
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
4. Thêm dữ liệu
app.get('/add', (req, res) => {
    res.render('add')
})

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

5. Xóa dữ liệu
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
6. Post 
app.listen(2000, () => {
    console.log('Server is running on port 2000!');
});

7. Body index.ejs
<header class="card-header font-weight-bold text-danger">Nhà xuất bản XYZ</header>
    <div class="content flex-lg-row mt-lg-5" style="width: 100vw; height: 100vh;">
        <a href="/add" class="btn btn-link">Thêm sản phẩm</a>
        <h1 class="text-center">Danh sách sản phẩm</h1>
        <table class="table table-striped">
            <tr>
                <th>Ma SP</th>
                <th>Ten SP</th>
                <th>So Luong</th>
                <th>Hanh Dong</th>
            </tr>
            <% for (let i = 0; i< sanPhams.length; i++) { %>
                <tr>
                    <td>
                        <%=sanPhams[i].ma_sp%>
                    </td>
                    <td>
                        <%=sanPhams[i].ten_sp%>
                    </td>
                    <td>
                        <%=sanPhams[i].so_luong%>
                    </td>
                    <td>
                        <form action="/delete" method="POST" enctype="multipart/form-data">
                            <input type="hidden" name="ma_sp" value="<%=sanPhams[i]["ma_sp"]%>" />
                            <input class="btn btn-primary" type="submit" value="Xóa" />
                        </form>
                    </td>
                </tr>
                <% } %>
        </table>
    </div>
8. add.ejs
<style>
        body {
            width: 99vw;
            height: 99vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        form {
            width: 50%;
            border: 1px solid gray;
            border-radius: 5px;
            padding: 30px;
        }
        
        .btn-primary {
            width: 100%;
        }
    </style>

   <form action="/them" method="POST" enctype="multipart/form-data">
        <h3 class="caption">Sản Phẩm</h3>
        <div class="form-group">
            <label for="">Mã sản phẩm</label>
            <input class="form-control" type="number" name="ma_sp">
        </div>
        <div class="form-group">
            <label for="">Tên sản phẩm</label>
            <input class="form-control" type="text" name="ten_sp">
        </div>
        <div class="form-group">
            <label for="">Số lượng</label>
            <input class="form-control" type="number" name="so_luong">
        </div>
        <% if(typeof errors !='undefined') 
        {%>
            <% for(let err of errors) 
                {%>
                    <h6 class="text-danger">
                        <%=err.msg%>
                    </h6>
                <%} 
            %>
        <%} 
    %>
        <div class="form-group">
            <label for=""></label>
            <input class="btn btn-primary" type="submit" value="Thêm sản phẩm">
        </div>
    </form>

