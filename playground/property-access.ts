const obj = { name: "Alice", age: 30 };
const value = obj.name;

function handleData(data: { toto: string }) {
  const toto = data.toto;
  console.log(toto);
}

const input = { toto: "hello" };
handleData(input);
