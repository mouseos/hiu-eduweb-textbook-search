//シラバスを検索する関数（background.jsを呼び出す）
function SeacrhSyllabusByWord(url, search_department, search_teacher) {
  return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
          action: 'getSyllabus',
          url,
          search_department,
          search_teacher
      }, response => {
          if (response) {
              resolve(response.data);
          } else {
              reject(new Error('Failed to fetch data from background'));
          }
      });
  });
}
//読み込み完了後に実行されるメイン処理
function main() {
  let department = document.querySelectorAll(".pull-right.student-info-header > div > span")[3].innerText.replace("所属:", "").trim();
  let week_table = document.querySelectorAll("#week-table-tbody");

  let timetable = {};
  let cnt_term = 0;
  let current_week;
  let subject;
  let teacher;
  //時間割を解析し、json変換
  week_table.forEach((table) => {
      timetable[cnt_term] = {};
      for (let i = 0; i < table.children.length; i++) {
          let day_table = (table.children[i].children);

          for (let j = 0; j < day_table.length; j++) {
              let timetable_str = (day_table[j].innerHTML);
              if (j == 0) {
                  timetable[cnt_term][timetable_str] = {};
                  current_week = timetable_str;
              }
              if (timetable_str.length != 0) {
                  let timetable_str_split = (timetable_str.split("<br>"));

                  subject = timetable_str_split[0];
                  teacher = timetable_str_split[1];
                  subject = (subject.trim());
                  if (typeof(teacher) == 'string') {
                      teacher = (teacher.trim());
                  }
              } else {
                  teacher = "";
                  subject = "";
              }
              if (j != 0) {
                  timetable[cnt_term][current_week][j - 1] = {
                      subject: subject,
                      teacher: teacher
                  };
              }
          }
      }
      cnt_term++;
  });


  //各学期ごとに保存する変数
  let textbooks_tmp = [[], [], [], [], []];
  for (const term in timetable) {
      for (const week in timetable[term]) {
          for (const day in timetable[term][week]) {
              const { subject, teacher } = timetable[term][week][day];
              if (subject && teacher) {
                  const searchText = `${subject}_${teacher}`;
                  const termIndex = parseInt(term);
                  if (!textbooks_tmp[termIndex].includes(searchText)) {
                      textbooks_tmp[termIndex].push(searchText);
                  }
              }
          }
      }
  }

  const promises = textbooks_tmp.map((textbooks, index) => {
      return Promise.all(textbooks.map(searchText => {
          const [subject, teacher] = searchText.split('_');
          return SeacrhSyllabusByWord(subject, department, teacher);
      })).then(textbooksData => {
		  //tabのidを保存する
          const tabId = `#tab${index + 1}`;
          document.querySelector(tabId).innerHTML += `<h4>購入教科書一覧</h4>
		  <div class="alert alert-info" role="alert">
			紀伊国屋書店をクリックした場合、教科書内容がクリップボードにコピーされた後ログイン画面に飛びます。
		  </div>
		  `;

          const tableHeader = `<thead class="sticky-top">
									<tr>
										<th>講義名</th>
										<th>担当教員</th>
										<th>教科書名</th>
										<th>著者名</th>
										<th>出版社</th>
										<th>備考</th>
										<th>購入</th>
									</tr>
								</thead>`;

          let tableBody = '<tbody>';
          textbooksData.forEach((textbook) => {
              if (textbook && textbook["講義名"] && textbook["担当教員"] && textbook["教科書"] && textbook["教科書"][0]) {
                  const { 講義名, 担当教員, 教科書 } = textbook;
                  const { 書名, 著者名, 出版社, 備考 } = 教科書[0];

                  tableBody += `<tr>
									<td>${講義名 ? 講義名 : ''}</td>
									<td>${担当教員 ? 担当教員 : ''}</td>
									<td>${書名 ? 書名 : ''}</td>
									<td>${著者名 ? 著者名 : ''}</td>
									<td>${出版社 ? 出版社 : ''}</td>
									<td>${備考 ? 備考 : ''}</td>
									<td class="shops text-nowrap">
										<ul>
											<li><a data="${書名} ${著者名}" href="https://mykits.kinokuniya.co.jp/Login/37002cfd-c010-4ae5-bcc4-e94f9a3fa48b" target="_blank">紀伊国屋書店</a></li>
											<li><a href="https://www.amazon.co.jp/s?k=${書名 ? 書名 : ''}+${著者名 ? 著者名 : ''}" target="_blank">amazon</a></li>
											<li><a href="https://www.mercari.com/jp/search/?keyword=${書名 ? 書名 : ''}+${著者名 ? 著者名 : ''}" target="_blank">メルカリ</a></li>
											<li><a href="https://paypayfleamarket.yahoo.co.jp/search/${書名 ? 書名 : ''}+${著者名 ? 著者名 : ''}" target="_blank">paypayフリマ</a></li>
											<li><a href="https://fril.jp/s?query=${書名 ? 書名 : ''}+${著者名 ? 著者名 : ''}" target="_blank">ラクマ</a></li>
											<li><a href="https://auctions.yahoo.co.jp/search/search?p=${書名 ? 書名 : ''}+${著者名 ? 著者名 : ''}" target="_blank">ヤフオク</a></li>
											<li><a href="https://www.google.com/search?q=${書名 ? 書名 : ''}+${著者名 ? 著者名 : ''}&tbm=shop" target="_blank">Google ショッピング</a></li>
										</ul>
									</td>      
							    </tr>`;
              }
          });
          tableBody += '</tbody>';

          const tableHTML = `<table class="table table-striped">${tableHeader}${tableBody}</table>`;
          document.querySelector(tabId).innerHTML += tableHTML;

          const elements = document.querySelectorAll(`${tabId} a[data]`);
		  //クリップボードに教科書名をコピーする
          elements.forEach(function (element) {
              element.addEventListener('click', async function (event) {
                  event.preventDefault();

                  const content = this.getAttribute('data');
                  try {
                      await navigator.clipboard.writeText(content);
                      window.open(this.href, '_blank');
                  } catch (error) {
                      console.error('クリップボードへのコピーに失敗しました:', error);
                  }
              });
          });
      });
  });

  Promise.all(promises)
      .then(() => {
          console.log('すべての処理が完了しました');
      })
      .catch(error => {
          console.error('エラーが発生しました:', error);
      });
}

window.onload = main;
