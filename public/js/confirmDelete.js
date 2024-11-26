function confirmDelete(event, carId) {
    // 削除確認ダイアログを表示
    const result = confirm(`車両ID[${carId}]のデータを削除しますか？`);
    if (!result) {
        event.preventDefault();
    }
}
