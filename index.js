const puppeteer = require('puppeteer');

const { v4: uuidv4 } = require('uuid');
var fs = require('fs');

var questionsFolder = uuidv4();

var numberOfQuestions = 0;

(async () => {
    const browser = await puppeteer.launch({ headless: false, timeout: 1200000 });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1368,
        height: 780,
        deviceScaleFactor: 1,
    });

    await page.setDefaultNavigationTimeout(0);
    await login(page);
    createFolders();

    await mockAnswerQuestions(page);
    // setTimeout(async () => {
    //     await saveAnswer(page);
    // }, 1500)
    // await page.screenshot({ path: 'example.png' });

    //await browser.close();
})();

function createFolders() {
    fs.mkdirSync(`./${questionsFolder}`);
    fs.mkdirSync(`./${questionsFolder}/questions`);
    fs.mkdirSync(`./${questionsFolder}/answers`);
    console.log(`Saving questions to ${questionsFolder}`);
}
async function mockAnswerQuestions(page) {
    await page.goto('https://www.gleim.com/testprep/cia/2019/part3?action=test', { waitUntil: 'networkidle2' });
    //click resume button
    // (await page.$eval('.linkbutton', a => a
    //     .filter(a => a.textContent === 'Resume Session')
    // ))[0].click();
    numberOfQuestions = 0;
    const elements = await page.$x('//*[@id="mainContent"]/div/div[3]/a[1]/div/span')
    await elements[0].click();

    setTimeout(async () => {
        numberOfQuestions = Number.parseInt(await page.$eval('#total-que-num', el => el.innerText));
        console.log(`Questions : ${numberOfQuestions}`);

        let count = Number.parseInt(await page.$eval('#display-que-num', el => el.innerText));

        while (count <= numberOfQuestions) {
            count += 1;
            await page.waitFor(3000);
            console.log(`selecting ${count} of ${numberOfQuestions}`);

            await page.screenshot({ path: `./${questionsFolder}/questions/question-${count + 1}.png` });

            await page.click('#answer-c');
            try {
                await page.click('.test-session-next');
            } catch (ex) {

                await page.waitForSelector('.test-session-next', async () => {
                    await page.click('.test-session-next');
                });
            }


        }
        setTimeout(async () => {
            await page.waitFor(6000);

            try {
                await page.click('.test-session-end');
            } catch{
                await page.click('.test-session-next');
            }
            //click grade buttton
            //    await page.waitForSelector('#button_grade', { timeout: 3000 }, async () => await page.click('#button_grade'))
            setTimeout(async () => {
                await page.click('#button_grade');
                await page.waitFor(10000);
                //click view review session button
                const btnReview = await page.$x('//*[@id="mainContent"]/div/div[2]/div[2]/div[3]/div/a');
                await btnReview[0].click();
                await page.waitFor(10000);

                await saveAnswers(page);
            }, 180000)

        }, 3000);


    }, 6000)



}

async function saveAnswers(page) {
    // await page.goto('https://www.gleim.com/testprep/cia/2019/part3?mod=TestSession&reviewID=21865890')

    console.log('Checking and saving answers')
    //if correct answer already selected
    studyUnit = await page.$eval('#stuName', el => el.innerText);
    studyUnitNo = await page.$eval('#stuNumber', el => el.innerText);
    topicName = await page.$eval('#topicName', el => el.innerText);
    topicNo = await page.$eval('#topicNumber', el => el.innerText);

    let testName = `${studyUnit}_${studyUnitNo}-${topicName}_${topicNo}`;

    fs.renameSync(questionsFolder, testName)
    // if (!fs.existsSync(`./${testName}`)) {
    //     fs.mkdirSync(`./${testName}`);
    // }

    for (let i = 0; i <= numberOfQuestions; i++) {
        await checkAnswers(page, i, testName);
        await page.click('.next-button');
    }


}

async function checkAnswers(page, index, folder) {
    const options = ['a', 'b', 'c', 'd'];
    if ((await page.$('.ansCorrect')) !== null) {
        await page.screenshot({ path: `./${folder}/answers/answer-${index + 1}.png` });
        return;
    }

    for (let i = 0; i < 4; i++) {
        console.log(`clicking : #answer-${options[i]}`)
        await page.click(`#answer-${options[i]}`);

        await page.waitFor(6000);
        //if the class below is displayed
        //.ansCorrect
        if ((await page.$('.ansCorrect')) !== null) {
            await page.screenshot({ path: `./${folder}/answers/answer-${index + 1}.png` });
            console.log('Correct anser saved');
            return;

        }

    }
}


async function createExam(page) {
    await page.goto('https://www.gleim.com/testprep/cia/2019/part3');
}

async function login(page) {
    await page.goto('https://www.gleim.com/account/index.php', { waitUntil: 'networkidle2' });
    await page.waitFor(3000);
    await page.type('#email', 'mukie4t@gmail.com');
    await page.type('#password', 'Amukelani22');

    await page.click('button[name="signin"');
}