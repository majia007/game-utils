// 缩写
const qs = (e) => document.querySelector(e);
const qsa = (e) => document.querySelectorAll(e);
const dgi = (e) => document.getElementById(e);
// 判断
function isCheck(input) {
    return ['radio', 'checkbox'].includes(input.type);
}
// 获取精度
function getAccuracy(input) {
    if (+input.dataset.accuracy)
        return +input.dataset.accuracy;
    if (!input.dataset.step)
        return 100;
    const length = (String(+input.dataset.step).split('.')[1] || '').length;
    return length < 3 ? 100 : 10 ** length;
}
// 获取输入框的值
function getValue(input) {
    if (isCheck(input))
        return +input.checked;
    return input.value.match(/[^\d.]/) && +(eval(input.value)) || +input.value || 0;
}
// 格式化数字
function showValue(num, rate = 1, accuracy = 1e2) {
    return (Math.round(num * accuracy * rate)) / accuracy;
}
// 打开新窗口
function openNewWindow(href = location.href, width = 450, height = 880) {
    window.open(href, '_blank', `width=${width},height=${height},left=${window.screenLeft + 32},top=${window.screenTop + 32}`);
}
// 绑定 input 相关数值操作
(function () {
    function handleFocus(e) {
        if (e.target instanceof HTMLInputElement)
            e.target.select();
    }
    function handleInput(e) {
        if ((e.target instanceof HTMLInputElement)) {
            const input = e.target;
            if (!input.id)
                return;
            if (isCheck(input)) {
                if (input.type === 'radio') {
                    input.name && localStorage.setItem(input.name, input.id);
                }
                else {
                    localStorage.setItem(input.id, input.checked ? 'true' : 'false');
                }
            }
            else {
                localStorage.setItem(input.id, input.value);
            }
        }
        window['计算']?.();
    }
    function handleWheel(e) {
        if ((e.target instanceof HTMLInputElement)) {
            const input = e.target;
            if (input.value.match(/\w \w/))
                return;
            const offset = (e.deltaY < 0 ? 1 : -1);
            const accuracy = getAccuracy(input);
            input.value = String(Math.round(accuracy * (getValue(input) + offset * (+input.dataset.step || 1))) / accuracy);
            input.value = String(Math.min(Math.max(+input.value, +(input.dataset.min || input.min) || 0), +(input.dataset.max || input.max) || 9e9));
            input.dispatchEvent(new InputEvent('input', { bubbles: true }));
        }
    }
    function handleKeydown(e) {
        if ((e.target instanceof HTMLInputElement)) {
            const input = e.target;
            if (input.value.match(/\w \w/))
                return;
            const offset = e.code === 'ArrowUp' ? 1 : e.code === 'ArrowDown' ? -1 : 0;
            if (!offset)
                return;
            e.preventDefault();
            const accuracy = getAccuracy(input);
            input.value = String(Math.round(accuracy * (getValue(input) + offset * (+input.dataset.step || 1))) / accuracy);
            input.value = String(Math.min(Math.max(+input.value, +(input.dataset.min || input.min) || 0), +(input.dataset.max || input.max) || 999999));
            input.dispatchEvent(new InputEvent('input', { bubbles: true }));
        }
    }
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('input', handleInput);
    document.addEventListener('wheel', handleWheel);
    document.addEventListener('keydown', handleKeydown);
})();
function bindValue(input) {
    const id = input.id;
    if (!id)
        return;
    if (isCheck(input)) {
        if (input.type === 'radio') {
            if (input.name && (localStorage.getItem(input.name) !== null)) {
                input.checked = localStorage.getItem(input.name) === input.id;
            }
        }
        else {
            if (localStorage.getItem(id) !== null) {
                input.checked = localStorage.getItem(id) === 'true';
            }
        }
    }
    else {
        input.value = localStorage.getItem(id) || input.dataset.default || '0';
    }
}
// 初始化绑定
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input').forEach(bindValue);
    window['计算']?.();
});
