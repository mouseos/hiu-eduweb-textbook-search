// content.js

function SeacrhSyllabusByWord(url,search_department,search_teacher) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'getSyllabus', url ,search_department,search_teacher }, response => {
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
	let department=document.querySelectorAll(".pull-right.student-info-header > div > span")[3].innerText.replace("所属:","").trim();
	//console.log("学部："+department);
	let week_table=document.querySelectorAll("#week-table-tbody")
	console.log(week_table);
	//時間割保管連想配列
	let timetable={};
	//学期を保存
	let cnt_term=0;
	let current_week;
	let subject;
	let teacher;
	week_table.forEach((table) => {
		timetable[cnt_term]={};
		//console.log(table.children);
		for (let i = 0; i < table.children.length ; i++){
		  let day_table=(table.children[i].children);
		  

		  
		  
		  for (let j=0; j<day_table.length; j++){
			  //時間割内文字列
			  let timetable_str=(day_table[j].innerHTML);
			  //console.log("timetable_str="+timetable_str);
			  /*console.log("j="+j);
			  console.log("i="+i);
			  console.log("cnt_term="+cnt_term);*/
			  if(j==0){
				  timetable[cnt_term][timetable_str]={};
				  current_week=timetable_str;
			  }
			  //授業名と教員名に分ける
			  if(timetable_str.length!=0){
				  let timetable_str_split=(timetable_str.split("<br>"));
				  //console.log(timetable_str_split);

				subject=timetable_str_split[0];
				teacher=timetable_str_split[1];
				subject=(subject.trim());
				//teacherがない場合
				if(typeof(teacher)=='string'){
					teacher=(teacher.trim());
				}
			  }else{
				  teacher="";
				  subject="";
			  }
				if(j!=0){
					timetable[cnt_term][current_week][j-1]={subject : subject,teacher: teacher};
				}
		  }
		}
		cnt_term++;
	});
	/*==============HTMLから時間割を取得する==============*/
	/*==============時間割下部に時間割表示==============*/
	document.querySelector("#tab1").innerHTML+="<h4>購入教科書一覧</h4><p>ここに書く</p>";
	/*==============時間割下部に時間割表示==============*/
	/*==============シラバスを検索する==============*/
	let search_department=department;
	let search_teacher="";












// SeacrhSyllabusByWord関数を呼び出す前に、timetableの内容を検索して渡す
for (const term in timetable) {
    for (const week in timetable[term]) {
      for (const day in timetable[term][week]) {
        const { subject, teacher } = timetable[term][week][day];
        if (subject && teacher) {
          SeacrhSyllabusByWord(subject, department, teacher)
            .then(data => {
              console.log(data);
              // ここで取得したdataを使って何かを行う（必要に応じて処理を追加）
            })
            .catch(error => {
              console.error('データの取得中にエラーが発生しました:', error);
            });
        }
      }
    }
  }






	/*==============シラバスを検索する==============*/
}

window.onload = main;