
// ExpressJS Setup
//express를 지원받아서 웹서버의 틀을 가져와서 적용
const express = require('express');
const app = express();
var bodyParser = require('body-parser');

// Constants
//웹서버 정보 지정
const PORT = 8000;
const HOST = "0.0.0.0";

 // Hyperledger Bridge //create wallet
 //지갑의 형식S
const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');//fs = file system
const path = require('path');
const ccpPath = path.resolve(__dirname, '..','..','basic-network','connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);
const walletPath = path.join(process.cwd(), 'wallet');
const wallet = new FileSystemWallet(walletPath);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
//지갑의 형식E




// ejs view template
//화면의 틀을 지정S========================================
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Index page
//메인화면의 정보를 보여줌
app.get('/', function (req, res) {
    res.render('index', { title: "Main Page", activate: "index"});
});

// Qeury all cars page
app.get('/queryallcars', function (req, res) {
    res.render('query', { title: "Query", activate: "query" });
});
// Create car page
app.get('/createcar', function (req, res) {
    res.render('createcar', { title: "Create Car", activate: "createcar"  });
});

// Change car owner page
app.get('/querycar', function (req, res) {
    res.render('querycar', { title: "Query Car", activate: "querycar" });
});

// Change car owner page
app.get('/changeowner', function (req, res) {
    res.render('changeowner', { title: "Change Owner", activate: "changeowner" });
});

//Query all cars의 버튼 기능 
app.get('/api/querycars', async function (req, res) {
        //1. 사용자 확인 (block)
        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        //네트워크에서 지갑 정보를 전부 가져옴
        const gateway = new Gateway();
        //주변월랫 정보를 모아서 
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
        //mychannel의 공간에 입력값 받기
        const network = await gateway.getNetwork('mychannel');
        //매칭
        const contract = network.getContract('fabcar');
        //검색한정보를 찿아옴
        const result = await contract.evaluateTransaction('queryAllCars');
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

        var obj = JSON.parse(result)
        res.json(obj)
});

// localhost:8080/api/querycar?carno=CAR5
app.get('/api/querycar/', async function (req, res) {
    try {
    //입력한 차량숫자 지정
    var carno = req.query.carno;
    //입력한 차량 숫자를 여기에 출력함(변수에 오가는 데이터 확인용 [없어도 무방])
	console.log(carno);

    const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        //매번 사용자 정보를 갱신하기 위해 밑의 코드를 사용함
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('fabcar');
        const result = await contract.evaluateTransaction('queryCar', carno);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        res.status(200).json({response: result.toString()});
        //사용자 정보를 불러오는 중에서 장애가 있을지 판별하는 코드
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(400).json(error);
    }
});

app.post('/api/createcar/', async function (req, res) {

    //변수의 위치는 어디서 하든 기능하나 잘못된정보를 가져오는것을 방지하기위해 변수 역시 포함시킴
    try {
	var carno = req.body.carno;
	var colour = req.body.colour;
	var make = req.body.make;
	var model = req.body.model;
	var owner = req.body.owner;

        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } }); 
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('fabcar');

        await contract.submitTransaction('createCar', carno, make, model, colour, owner);
        console.log('Transaction has been submitted');
        await gateway.disconnect();

        res.status(200).json({response: 'Transaction has been submitted'});

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(400).json(error);
    }   

});

app.post('/api/changeowner/', async function (req, res) {
    try {
        var carno = req.body.carno;
        var owner = req.body.owner;

        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } }); 

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('fabcar');

        //데이타를 넣거나 수정할때 submitTransaction을 불러다 씀
        await contract.submitTransaction('changeCarOwner', carno, owner);
        
        console.log('Transaction has been submitted');
        await gateway.disconnect();
        res.status(200).json({response: 'Transaction has been submitted'});

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(400).json(error);
    }   
});
//화면의 틀을 지정E========================================



// server start
//시작하는 명령어
//컴퓨터가 살아있는지 확인하기위한 코드
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
