function generate_voucher() {
    const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    function getRandomCharacters(length, characterSet) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characterSet.charAt(Math.floor(Math.random() * characterSet.length));
        }
        return result;
    }

    const part1 = getRandomCharacters(4, alphabets);
    const part2 = getRandomCharacters(4, numbers);
    const part3 = getRandomCharacters(4, numbers);

    const voucher = `${part1}-${part2}-${part3}`;
    return voucher;
}

const voucherCode = generate_voucher();
console.log(voucherCode);
