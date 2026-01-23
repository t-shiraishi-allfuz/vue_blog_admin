import Swal from 'sweetalert2';

// アプリ全体の標準設定を定義
export const AppSwal = Swal.mixin({
	reverseButtons: true,
	confirmButtonColor: '#27C1A3',
	cancelButtonColor: '#BDBDBD',
	confirmButtonText: 'OK',
	cancelButtonText: '閉じる',
	showConfirmButton: false,
	showCancelButton: true,
})
