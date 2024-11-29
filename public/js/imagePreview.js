document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('car_image_upload');
    const imagePreview = document.querySelector('.car-image-preview');
    const defaultImage = '/resources/demo.png'; // デフォルト画像のパス

    // 初期状態でデフォルト画像を表示
    imagePreview.src = defaultImage;

    imageInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            // ファイルが選択されていない場合はデフォルト画像を表示
            imagePreview.src = defaultImage;
        }
    });
});