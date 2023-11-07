
// ページの読み込みが完了した後に実行する関数
function main() {
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
			  console.log("timetable_str="+timetable_str);
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
				  console.log(timetable_str_split);

				subject=timetable_str_split[0];
				teacher=timetable_str_split[1];
				subject=(subject.trim());
				if(typeof(teacher)=='string'){
					teacher=(teacher.trim());
				}
				
				console.log(typeof(teacher));
				  
				  
				  
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
	
	console.log(timetable);
	//html追加
	document.querySelector("#tab1").innerHTML+="<h4>購入教科書一覧</h4><p>ここに書く</p>";
}

window.onload = main;
