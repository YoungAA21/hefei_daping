import {MockMethod} from 'vite-plugin-mock';
import Mock from 'mockjs';
import dayjs from 'dayjs'


const mock: MockMethod[] = [
    // 空调实时监测
    // vue3 mockjs生成 空调实时监测 接口
    {
        url: '/api/airConditionerRealtimeMonitoring',
        method: 'get',
        response: () => {
            return {
                status: 200,
                message: 'success',
                data: [
                    {
                        name: '回风温度',
                        icon: 'icon-00-wendushezhi-05',
                        num: Mock.Random.integer(25, 30),
                        unit: '℃'
                    },
                    {
                        name: '设定温度',
                        icon: 'icon-wendushezhi2-05-05',
                        num: Mock.Random.integer(25, 30),
                        unit: '℃'
                    },
                    {
                        name: '回风湿度',
                        icon: 'icon-shidu1',
                        num: Mock.Random.integer(40, 50),
                        unit: '%'
                    },
                    {
                        name: '设定湿度',
                        icon: 'icon-shidu2',
                        num: Mock.Random.integer(40, 50),
                        unit: '%'
                    }
                ],
            };
        },
    },
    // 温湿度实时曲线图
    // vue3 mockjs生成 温湿度实时曲线图 接口  数组10组 name为时间每隔1分钟一个 hh:mm value1 随机20-30 value2 随机40-50
    {
        url: '/api/temperature-humidity',
        method: 'get',
        response: () => {
            function generateData() {
                let data = []
                let now = new Date()

                for (let i = 0; i < 10; i++) {
                    now.setMinutes(now.getMinutes() - 1) // 每次减少一分钟
                    let hh = String(now.getHours()).padStart(2, '0')
                    let mm = String(now.getMinutes()).padStart(2, '0')

                    data.push({
                        name: `${hh}:${mm}`,
                        value1: Mock.Random.float(20, 30, 2, 2), // 随机数，保留两位小数
                        value2: Mock.Random.float(40, 50, 2, 2) // 随机数，保留两位小数
                    })
                }

                return data.reverse() // 将数据反转，使其从早到晚
            }


            return {
                status: 200,
                message: 'success',
                data: generateData,
            };
        },
    },

    // 设备状态
    // vue3 mockjs生成 设备状态 接口  数组 name [灯光 门禁 烟感 水浸 红外 温湿度 摄像机] value 随机1-100
    {
        url: '/api/device/status',
        method: 'get',
        response: () => {
            // 定义设备名称和随机值范围
            const deviceNames = ['灯光', '门禁', '烟感', '水浸', '红外', '温湿度', '摄像机'];

// 生成随机设备状态数据
            const generateDeviceStatus = () => {
                const data = [];
                deviceNames.forEach((name) => {
                    const value = Mock.Random.integer(1, 100);
                    const value2 = Mock.Random.integer(1, 100);
                    data.push({name, value, value2});
                });
                return data;
            };

            return {
                status: 200,
                message: 'success',
                data: generateDeviceStatus,
            };
        },
    },

    // 告警列表接口
    // vue3 mockjs生成 告警列表接口
    {
        url: '/api/alarm/list',
        method: 'get',
        response: () => {

            const alarmData = [
                {
                    content: '温度超阈值上限',
                    device: '温湿度01',
                    time: '2022-11-07 12:15:46',
                },
                {
                    content: '制冷压力超阈值上限',
                    device: '精密空调',
                    time: '2022-11-07 12:15:46',
                },
                {
                    content: '检测到有水',
                    device: '水浸',
                    time: '2022-11-07 12:15:46',
                },
                {
                    content: '开门时间异常',
                    device: '东门门禁',
                    time: '2022-11-07 12:15:46',
                },
                {
                    content: '设备离线',
                    device: '摄像机1',
                    time: '2022-11-07 12:15:46',
                },
                {
                    content: '检测到有人',
                    device: '红外1',
                    time: '2022-11-07 12:15:46',
                },
            ];
            const randomTime = () => {
                const currentDate = dayjs(); // 获取当前日期时间
                const randomMinute = Math.floor(Math.random() * 1440); // 生成0到1439之间的随机分钟数（一天有1440分钟）

                // 使用dayjs进行时间计算
                const randomDateTime = currentDate.subtract(randomMinute, 'minute');

                // 格式化随机时间
                const formattedTime = randomDateTime.format('YYYY-MM-DD HH:mm:ss');
                return formattedTime;
            };

// 生成告警列表接口数据
            const generateAlarmList = () => {
                const alarmList = [];
                alarmData.forEach((alarm) => {
                    const randomTimestamp = Mock.Random.datetime(); // 随机生成时间戳
                    alarmList.push({
                        content: alarm.content,
                        device: alarm.device,
                        time: randomTime(), // 使用随机时间
                    });
                });
                return alarmList;
            };

            return {
                status: 200,
                message: 'success',
                data: generateAlarmList,
            };
        },
    },

    // 告警信息数量
    // vue3 mockjs生成 告警信息数量接口
    {
        url: '/api/warnings',
        method: 'get',
        response: () => {

            let data = [
                {
                    name: '一般告警',
                    value: Mock.Random.integer(1, 100),
                    color1: 'rgba(253, 168, 62, 1)',
                    color2: 'rgba(254, 217, 82, 1)',
                    checked: true
                },
                {
                    name: '严重告警',
                    value: Mock.Random.integer(1, 100),
                    color1: 'rgba(8, 170, 135, 1)',
                    color2: 'rgba(14, 224, 159, 1)',
                    checked: true
                },
                {
                    name: '紧急告警',
                    value: Mock.Random.integer(1, 100),
                    color1: 'rgba(15, 234, 234, 1)',
                    color2: 'rgba(11, 155, 159, 1)',
                    checked: true
                }
            ];
            return {
                status: 200,
                message: 'success',
                data: data,
            };
        },
    },
    // 告警信息设备
    // vue3 mockjs生成 告警信息设备接口
    {
        url: '/api/AlarmInformationDevice',
        method: 'get',
        response: () => {

            let data = [
                {
                    name: '温湿度',
                    value: Mock.Random.integer(1, 10),
                    color1: 'rgba(234, 82, 15, 1)',
                    color2: 'rgba(248, 101, 20, 1)',
                    checked: true
                },
                {
                    name: '烟感',
                    value: Mock.Random.integer(1, 10),
                    color1: 'rgba(247, 18, 56, 1)',
                    color2: 'rgba(248, 20, 111, 1)',
                    checked: true
                }, {
                    name: '红外',
                    value: Mock.Random.integer(1, 10),
                    color1: 'rgba(94, 18, 247, 1)',
                    color2: 'rgba(154, 20, 248, 1)',
                    checked: true
                }];
            return {
                status: 200,
                message: 'success',
                data: data,
            };
        },
    },

    // UPS电源
    // vue3 mockjs生成 UPS电源 接口
    {
        url: '/api/UPSPowerSupply',
        method: 'get',
        response: () => {
            return {
                status: 200,
                message: 'success',
                data: [
                    {
                        name: '输出功率',
                        icon: 'icon-gongshuai',
                        num: Mock.Random.integer(1400, 1500),
                        unit: 'W'
                    },
                    {
                        name: '电池电量',
                        icon: 'icon-dianchi',
                        num: Mock.Random.integer(450, 500),
                        unit: 'A·h'
                    },
                    {
                        name: '电池温度',
                        icon: 'icon-wendu',
                        num: Mock.Random.integer(20, 30),
                        unit: '℃'
                    },
                    {
                        name: '电池电压',
                        icon: 'icon-youhailaji-xudianchi',
                        num: Mock.Random.integer(200, 220),
                        unit: 'V'
                    }
                ],
            };
        },
    },

    // 安全运行天数
    // vue3 mockjs生成 安全运行天数 接口
    {
        url: '/api/safeOperatingDays',
        method: 'get',
        response: () => {
            return {
                status: 200,
                message: 'success',
                data: Mock.Random.integer(10, 900),
            };
        },
    },
    // 机房设备
    // vue3 mockjs生成 机房设备 接口
    {
        url: '/api/machineRoomEquipment',
        method: 'get',
        response: () => {
            function randomTimeWithinHour() {
                const randomMinutes = Math.floor(Math.random() * 60);
                const randomSeconds = Math.floor(Math.random() * 60);
                return dayjs().subtract(randomMinutes, 'minute').subtract(randomSeconds, 'second').format('YYYY年MM月DD日HH:mm:ss');
            }

            return {
                status: 200,
                message: 'success',
                data: [
                    {
                    name: '摄像机',
                    icon: 'icon-shexiangtou',
                    'status|1': ['在线', '离线'],
                    time: randomTimeWithinHour,
                    data: []
                }, {
                    name: '水浸',
                    icon: 'icon-shuijin_jinshui',
                    'status|1': ['在线', '离线'],
                    time: randomTimeWithinHour,
                    data: []
                }, {
                    name: '温湿度',
                    icon: 'icon-wendu1',
                    'status|1': ['在线', '离线'],
                    time: randomTimeWithinHour,
                    data: [
                        {
                            name: '温度',
                            value: '25°C'
                        }, {
                            name: '湿度',
                            value: '50%'
                        },
                    ]
                }, {
                    name: '灯光',
                    icon: 'icon-dengguang',
                    'status|1': ['在线', '离线'],
                    time: randomTimeWithinHour,
                    data: [
                        {
                            name: '照明状态',
                            value: '25°C'
                        }, {
                            name: '调光值',
                            value: '50%'
                        },
                    ]
                }, {
                    name: '烟感',
                    icon: 'icon-yangan',
                    'status|1': ['在线', '离线'],
                    time: randomTimeWithinHour,
                    data: []
                }],
            };
        },
    },
];

export default mock;
