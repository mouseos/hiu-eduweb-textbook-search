// content.js

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

// ページの読み込みが完了した後に実行する関数
function main() {
	/*==============HTMLから時間割を取得する==============*/
	//学部名
	let department = document.querySelectorAll(".pull-right.student-info-header > div > span")[3].innerText.replace("所属:", "").trim();
	//console.log("学部："+department);
	let week_table = document.querySelectorAll("#week-table-tbody")
	console.log(week_table);
	//時間割保管連想配列
	let timetable = {};
	//学期を保存
	let cnt_term = 0;
	let current_week;
	let subject;
	let teacher;
	week_table.forEach((table) => {
		timetable[cnt_term] = {};
		//console.log(table.children);
		for (let i = 0; i < table.children.length; i++) {
			let day_table = (table.children[i].children);




			for (let j = 0; j < day_table.length; j++) {
				//時間割内文字列
				let timetable_str = (day_table[j].innerHTML);
				//console.log("timetable_str="+timetable_str);
				/*console.log("j="+j);
				console.log("i="+i);
				console.log("cnt_term="+cnt_term);*/
				if (j == 0) {
					timetable[cnt_term][timetable_str] = {};
					current_week = timetable_str;
				}
				//授業名と教員名に分ける
				if (timetable_str.length != 0) {
					let timetable_str_split = (timetable_str.split("<br>"));
					//console.log(timetable_str_split);

					subject = timetable_str_split[0];
					teacher = timetable_str_split[1];
					subject = (subject.trim());
					//teacherがない場合
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
	/*==============HTMLから時間割を取得する==============*/

	/*==============シラバスを検索する==============*/
	let search_department = department;
	let search_teacher = "";

	// 全てのプロミスを待つための配列
	let textbooks_tmp = new Set();
	let terms = ["前期前半", "前期後半", "後期前半", "後期後半"];
	for (const term in timetable) {
		for (const week in timetable[term]) {
			for (const day in timetable[term][week]) {
				const {
					subject,
					teacher
				} = timetable[term][week][day];
				if (subject && teacher) {
					// 重複をチェックしてから追加
					const searchText = `${subject}_${teacher}`;
					if (!textbooks_tmp.has(searchText)) {
						textbooks_tmp.add(searchText); // Setに追加
					}
				}
			}
		}
	}

	// Setから配列に変換してPromise.allを実行する
	Promise.all(Array.from(textbooks_tmp).map(searchText => {
			const [subject, teacher] = searchText.split('_');
			return SeacrhSyllabusByWord(subject, department, teacher);
		}))
		.then(textbooks => {
			let filteredTextbooks = textbooks.filter(data => data !== null);
			console.log(filteredTextbooks);
			document.querySelector("#tab1").innerHTML += "<h4>購入教科書一覧</h4>";

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
			console.log(filteredTextbooks);
			filteredTextbooks.forEach((textbook) => {
				if (textbook && textbook["講義名"] && textbook["担当教員"] && textbook["教科書"] && textbook["教科書"][0]) {
					const {
						講義名,
						担当教員,
						教科書
					} = textbook;
					const {
						書名,
						著者名,
						出版社,
						備考
					} = 教科書[0];

					tableBody += `<tr>
                              <td>${講義名 ? 講義名 : ''}</td>
                              <td>${担当教員 ? 担当教員 : ''}</td>
                              <td>${書名 ? 書名 : ''}</td>
                              <td>${著者名 ? 著者名 : ''}</td>
                              <td>${出版社 ? 出版社 : ''}</td>
                              <td>${備考 ? 備考 : ''}</td>
                              <!--紀伊国屋書店 amazon メルカリ paypayフリマ ラクマ ヤフオクで検索-->
                              <td class="shops text-nowrap">
                                  <!--紀伊国屋書店はログインしないと検索できない。そのため、クリップボードに書名をコピーしてからhttps://mykits.kinokuniya.co.jp/Login/37002cfd-c010-4ae5-bcc4-e94f9a3fa48bに飛ばす-->
                                  <ul>
                                  <li><a data="${書名} ${著者名}" href="https://mykits.kinokuniya.co.jp/Login/37002cfd-c010-4ae5-bcc4-e94f9a3fa48b" target="_blank">紀伊国屋書店</a></li>
                                  <li><a href="https://www.amazon.co.jp/s?k=${書名 ? 書名 : ''}+${著者名 ? 著者名 : ''}" target="_blank">amazon</a></li>
                                  <li><a href="https://www.mercari.com/jp/search/?keyword=${書名 ? 書名 : ''}+${著者名 ? 著者名 : ''}" target="_blank">メルカリ</a></li>
                                  <li><a href="https://paypayfleamarket.yahoo.co.jp/search/${書名 ? 書名 : ''}+${著者名 ? 著者名 : ''}" target="_blank">paypayフリマ</a></li>
                                  <li><a href="https://fril.jp/s?query=${書名 ? 書名 : ''}+${著者名 ? 著者名 : ''}" target="_blank">ラクマ</a></li>
                                  <li><a href="https://auctions.yahoo.co.jp/search/search?p=${書名 ? 書名 : ''}+${著者名 ? 著者名 : ''}" target="_blank">ヤフオク</a></li>
                                  </ul>
                              </td>      
                        </tr>`;
				}
			});

			tableBody += '</tbody>';

			const tableHTML = `<table class="table table-striped">${tableHeader}${tableBody}</table>`;
			document.querySelector("#tab1").innerHTML += tableHTML;
			console.log('完了');
			const elements = document.querySelectorAll('a[data]');

			elements.forEach(function(element) {
				element.addEventListener('click', async function(event) {
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
		})
		.catch(error => {
			console.error('エラーが発生しました:', error);
		});

	/*==============シラバスを検索する==============*/
}

window.onload = main;