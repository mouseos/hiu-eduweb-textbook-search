// background.js

function getTextbook(url) {
	return fetch(url)
		.then(response => response.text())
		.then(data => {
			let htmlString = data;
			// JSON形式で返す
			return htmlString;
		})
		.catch(error => {
			console.error('データの取得中にエラーが発生しました:', error);
			return null;
		});
}


function getSyllabusData(search_word, search_department, search_teacher) {
	const url = "https://syllabus.do-johodai.ac.jp/keyword?from=title&keyword=" + search_word;
	return fetch(url)
		.then(response => response.text())
		.then(data => {
			let htmlString = data;
			console.log(htmlString);
			const regex = /<tr>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td><a href="(.*?)"[^>]*>詳細<\/a><\/td>\s*<\/tr>/g;
			let match;
			let syllabusData;

			while ((match = regex.exec(htmlString)) !== null) {
				const [, lectureName, department, teacher, detailLink] = match;
				
				if (department.toLowerCase().includes(search_department.trim().toLowerCase())&& teacher.trim().toLowerCase() === search_teacher.trim().toLowerCase()) {
					syllabusData = {
						'講義名': lectureName.trim(),
						'学科': department.trim(),
						'担当教員': teacher.trim(),
						'詳細': detailLink.trim()
					};
				}
			}

			if (!syllabusData) {
				//見つからない場合コンソール出力（デバッグ）
				console.log(search_department + "," + search_teacher + "先生の" + search_word + "の講義は見つかりませんでした。");
				return null;
			}
			console.log(syllabusData);
			// 教科書の取得
			return getTextbook(syllabusData['詳細'])
				.then(textbookResult => {
					let textbook_tmp = textbookResult.split('<table class="striped">');
					let extractedTextbook = {};
					let extractedTextbooks = [];
					textbook_tmp.forEach(item => {
						//教科書に関するタグ部分を抜き出し、各項目に分割
						if (item.includes('教科書')) {
							item.split("<li>").forEach(item2 => {
								if (item2.includes('書名')) {
									item2.replace(/<[\s\S]*/g, '').trim().split(',').forEach(item3 => {
										item3 = item3.trim();
										if (item3.includes('書名:')) {
											if (Object.keys(extractedTextbook).length !== 0) {
												extractedTextbooks.push({
													...extractedTextbook
												}); 
												//console.log(extractedTextbook);
												extractedTextbook = {}; //extractedTextbookをリセット
											}
											extractedTextbook["書名"] = (item3.replace('書名:', ''));
											console.log(item3.replace('書名:', ''));
										} else if (item3.includes('著者名:')) {
											extractedTextbook["著者名"] = (item3.replace('著者名:', ''));
											console.log(item3.replace('著者名:', ''));
										} else if (item3.includes('出版社:')) {
											extractedTextbook["出版社"] = (item3.replace('出版社:', ''));
											console.log(item3.replace('出版社:', ''));
										} else if (item3.includes('備考:')) {
											extractedTextbook["備考"] = (item3.replace('備考:', ''));
											console.log(item3.replace('備考:', ''));
										}
									});
								}
							});
						}
					});

					//  extractedTextbookをextractedTextbooksに追加
					if (Object.keys(extractedTextbook).length !== 0) {
						extractedTextbooks.push({
							...extractedTextbook
						});
						//console.log(extractedTextbook);
					}

					syllabusData['教科書'] = extractedTextbooks;
					return syllabusData;
				})
				.catch(error => {
					console.error('教科書の取得中にエラーが発生しました:', error);
					return null;
				});
		})
		.catch(error => {
			console.error('データの取得中にエラーが発生しました:', error);
			return null;
		});
}


//content.jsから呼び出す
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'getSyllabus') {
		getSyllabusData(request.url, request.search_department, request.search_teacher)
			.then(data => {
				sendResponse({
					data
				});
			});
		return true;
	}
});