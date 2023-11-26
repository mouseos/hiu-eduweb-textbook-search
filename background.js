// background.js
function getTextbook(url) {
  return fetch(url)
    .then(response => response.text())
    .then(data => {
		let htmlString=data;
	  // JSON形式で返す
	  return htmlString;
    })
    .catch(error => {
      console.error('データの取得中にエラーが発生しました:', error);
      return null;
    });
}


function getSyllabusData(search_word,search_department,search_teacher) {
	const url="https://syllabus.do-johodai.ac.jp/keyword?from=title&keyword="+search_word;
  return fetch(url)
    .then(response => response.text())
    .then(data => {
		let htmlString=data;

	  // 正規表現を使って該当のテーブルの内容を抽出
	  const regex = /<tr>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td><a href="(.*?)"[^>]*>詳細<\/a><\/td>\s*<\/tr>/g;
	  let match;
	  let syllabusData;
	  // マッチするテーブル行を全て処理
	  while ((match = regex.exec(htmlString)) !== null) {
		const [, lectureName, department, teacher, detailLink] = match;
		//console.log(department.trim());
		//console.log(department.trim()+'=='+search_department);
		console.log(teacher.trim()+'=='+search_teacher);
		if (department.trim().toLowerCase() === search_department.trim().toLowerCase() && teacher.trim().toLowerCase() === search_teacher.trim().toLowerCase()){
			syllabusData = {
			  '講義名': lectureName.trim(),
			  '学科': department.trim(),
			  '担当教員': teacher.trim(),
			  '詳細': detailLink.trim()
			};
			
		}
	  }
      //test
	  let textbookResult=[];
	  getTextbook(syllabusData['詳細'])
	  .then(textbookResult => {
		  let textbook_tmp=textbookResult.split('<table class="striped">');
		  //教科書が含まれているものを探す
		  textbook_tmp.forEach(function(item,index){
			  if(item.indexOf('教科書')!=-1){
				  item.split("<li>").forEach(function(item2,index2){
					  if(item2.indexOf('書名')!=-1){
						item2.replace(/<[\s\S]*/g, '').trim().split(',').forEach(function(item3,index3){
							item3=item3.trim();
							if(item3.indexOf('書名')){
								textbookResult.push(item3.replace('書名:',''));
								console.log(item3.replace('書名:',''));//動作しない
							}else if(item3.indexOf('著者名')){
								textbookResult.push(item3.replace('著者名:',''));
								console.log(item3.replace('著者名:',''));//動作しない
							}else if(item3.indexOf('出版社')){
								textbookResult.push(item3.replace('出版社:',''));
								console.log(item3.replace('出版社:',''));//動作しない
							}
						});
					  }
				  });
			  }
		  });
		  syllabusData['教科書']=textbookResult;
		
	  })
	  .catch(error => {
		console.error('テキストブックの取得中にエラーが発生しました:', error);
	  });
	  //test
	  // JSON形式で返す
	  if(syllabusData.length==0){
		console.log(search_department+","+search_teacher+"先生の"+search_word+"の講義は見つかりませんでした。");
	  }
	  return syllabusData;
    })
    .catch(error => {
      console.error('データの取得中にエラーが発生しました:', error);
      return null;
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSyllabus') {
    getSyllabusData(request.url,request.search_department,request.search_teacher)
      .then(data => {
        sendResponse({ data });
      });
    return true;
  }
});
