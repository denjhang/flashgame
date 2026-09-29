// TCS H5 内嵌数据 — 由 deobf/data/*.json 生成
const WEAPONS={"null": [0, 0, 0, 0, 0, 0], "m60": [5, 350, 40, 1, 3, 3], "gatling": [4, 380, 40, 1, 3, 3], "canon75": [4, 480, 40, 1, 12, 16], "canon105": [3, 620, 65, 1, 20, 30], "canon105D": [3, 620, 33, 2, 15, 30], "radar": [0, 1200, 0, 0, 0, 0], "crotale": [4, 800, 180, 1, 41, 80], "canon125": [2, 1200, 150, 1, 60, 80], "MLRS": [2, 1300, 480, 1, 40, 120], "pluton": [1, 10000, 720, 1, 2500, 300], "MTHEL": [4, 800, 150, 1, 120, 2], "radarMobile": [0, 1500, 0, 0, 0, 0], "m60Brad": [3, 350, 40, 1, 2, 3], "75mmBrad": [3, 480, 40, 1, 10, 10], "gatlingAmx10": [3, 380, 40, 1, 2, 3], "75mmAmx10": [3, 500, 40, 1, 12, 10], "105mmAbrams": [2, 620, 65, 1, 18, 20], "105mmDAbrams": [2, 620, 33, 2, 13, 20], "crotaleAbrams": [2, 800, 220, 1, 40, 50], "125mmT90": [2, 1000, 120, 1, 40, 65], "gatlingDT90": [2, 700, 3, 2, 3, 4], "gatlingDTigre": [5, 620, 3, 2, 3, 3], "crotaleTigre": [2, 800, 100, 1, 40, 50], "navireCrotale": [2, 1250, 140, 1, 50, 50], "Yamato460": [2, 10000, 30, 4, 40, 80]};
// structureData (原版 185/frame_1/PlaceObject2_86_1 load): [0]=满血 maxHp, [1]=建造价 cost
//   (N+58 勘误: 旧版把 [0] 当建造价/[1] 当升级价 — 商店槽位实测建造价 = [1], 血量 = [0])
const STRUCTURES={"m60": {"cost": 120, "maxHp": 80}, "gatling": {"cost": 200, "maxHp": 120}, "canon75": {"cost": 300, "maxHp": 220}, "canon105": {"cost": 420, "maxHp": 280}, "canon105D": {"cost": 540, "maxHp": 300}, "canon125": {"cost": 1400, "maxHp": 240}, "crotale": {"cost": 1000, "maxHp": 220}, "radar": {"cost": 250, "maxHp": 220}, "MLRS": {"cost": 2200, "maxHp": 320}, "pluton": {"cost": 5000, "maxHp": 600}, "MTHEL": {"cost": 1200, "maxHp": 300}};
const CHASSIS={"camion1": [3.2, 1.8, 3, 160, 50], "camion2": [3.2, 1.8, 2.5, 200, 50], "camion3": [3.2, 1.8, 2.5, 200, 50], "jeep": [3.2, 1.8, 4, 140, 60], "bradley": [3, 1.7, 2.5, 345, 155], "amx10": [3, 1.7, 2.5, 440, 250], "abrams": [3, 1.7, 2, 880, 340], "t90": [3, 1.7, 1.5, 1200, 500], "camionBlinde": [3, 1.7, 1.2, 2800, 250], "tigre": [3, 1.8, 5, 400, 500], "navire": [1, 0.3, 0.8, 1800, 1000], "Yamato": [0.5, 0.2, 0.2, 20000, 0]};
const WAVES=[[{"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "jeep", "weapon": "null"}, {"type": "jeep", "weapon": "null"}, {"type": "jeep", "weapon": "null"}, {"type": "jeep", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}], [{"type": "jeep", "weapon": "null"}, {"type": "jeep", "weapon": "null"}, {"type": "jeep", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion2", "weapon": "null"}, {"type": "camion2", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}], [{"type": "jeep", "weapon": "null"}, {"type": "jeep", "weapon": "null"}, {"type": "camion2", "weapon": "null"}, {"type": "camion2", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}], [{"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion3", "weapon": "radarMobile"}, {"type": "camion3", "weapon": "radarMobile"}, {"type": "camion2", "weapon": "null"}, {"type": "camion3", "weapon": "radarMobile"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}], [{"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}], [{"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "m60Brad"}], [{"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "camion2", "weapon": "null"}, {"type": "camion2", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "m60Brad"}], [{"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "75mmBrad"}], [{"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "75mmBrad"}], [{"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "camion3", "weapon": "radarMobile"}, {"type": "amx10", "weapon": "gatlingAmx10"}], [{"type": "bradley", "weapon": "75mmBrad"}, {"type": "jeep", "weapon": "m60"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "camion2", "weapon": "null"}, {"type": "camion2", "weapon": "null"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}], [{"type": "camion3", "weapon": "radarMobile"}, {"type": "camion3", "weapon": "radarMobile"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}], [{"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}], [{"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}], [{"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "camion3", "weapon": "radarMobile"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}], [{"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion2", "weapon": "null"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "abrams", "weapon": "105mmAbrams"}, {"type": "abrams", "weapon": "105mmAbrams"}, {"type": "abrams", "weapon": "105mmAbrams"}], [{"type": "abrams", "weapon": "105mmAbrams"}, {"type": "abrams", "weapon": "105mmAbrams"}, {"type": "camion2", "weapon": "null"}, {"type": "camion2", "weapon": "null"}, {"type": "jeep", "weapon": "m60"}, {"type": "abrams", "weapon": "105mmAbrams"}, {"type": "abrams", "weapon": "105mmAbrams"}], [{"type": "tigre", "weapon": "gatlingDTigre"}, {"type": "tigre", "weapon": "gatlingDTigre"}, {"type": "tigre", "weapon": "gatlingDTigre"}, {"type": "tigre", "weapon": "gatlingDTigre"}, {"type": "tigre", "weapon": "gatlingDTigre"}, {"type": "tigre", "weapon": "gatlingDTigre"}], [{"type": "abrams", "weapon": "105mmAbrams"}, {"type": "abrams", "weapon": "105mmAbrams"}, {"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}], [{"type": "abrams", "weapon": "105mmDAbrams"}, {"type": "abrams", "weapon": "105mmDAbrams"}, {"type": "abrams", "weapon": "105mmDAbrams"}, {"type": "abrams", "weapon": "105mmDAbrams"}, {"type": "abrams", "weapon": "105mmDAbrams"}], [{"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "abrams", "weapon": "crotaleAbrams"}, {"type": "abrams", "weapon": "crotaleAbrams"}, {"type": "abrams", "weapon": "105mmDAbrams"}], [{"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "abrams", "weapon": "105mmAbrams"}, {"type": "abrams", "weapon": "105mmAbrams"}, {"type": "abrams", "weapon": "crotaleAbrams"}, {"type": "abrams", "weapon": "105mmDAbrams"}, {"type": "amx10", "weapon": "75mmAmx10"}], [{"type": "abrams", "weapon": "105mmDAbrams"}, {"type": "camion3", "weapon": "radarMobile"}, {"type": "camion3", "weapon": "radarMobile"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "abrams", "weapon": "105mmDAbrams"}, {"type": "abrams", "weapon": "105mmDAbrams"}, {"type": "abrams", "weapon": "105mmDAbrams"}, {"type": "amx10", "weapon": "75mmAmx10"}], [{"type": "abrams", "weapon": "105mmDAbrams"}, {"type": "abrams", "weapon": "105mmDAbrams"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "abrams", "weapon": "crotaleAbrams"}, {"type": "abrams", "weapon": "crotaleAbrams"}, {"type": "abrams", "weapon": "105mmAbrams"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "75mmBrad"}], [{"type": "navire", "weapon": "navireCrotale"}, {"type": "navire", "weapon": "navireCrotale"}], [{"type": "tigre", "weapon": "crotaleTigre"}, {"type": "tigre", "weapon": "crotaleTigre"}, {"type": "tigre", "weapon": "crotaleTigre"}, {"type": "tigre", "weapon": "crotaleTigre"}, {"type": "tigre", "weapon": "crotaleTigre"}, {"type": "tigre", "weapon": "crotaleTigre"}], [{"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "abrams", "weapon": "105mmAbrams"}, {"type": "abrams", "weapon": "105mmAbrams"}, {"type": "abrams", "weapon": "105mmAbrams"}, {"type": "abrams", "weapon": "105mmAbrams"}, {"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "abrams", "weapon": "105mmDAbrams"}, {"type": "camion2", "weapon": "null"}, {"type": "camion2", "weapon": "null"}], [{"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "abrams", "weapon": "105mmDAbrams"}, {"type": "abrams", "weapon": "105mmDAbrams"}, {"type": "abrams", "weapon": "crotaleAbrams"}, {"type": "abrams", "weapon": "crotaleAbrams"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}], [{"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "abrams", "weapon": "105mmAbrams"}, {"type": "abrams", "weapon": "crotaleAbrams"}, {"type": "abrams", "weapon": "105mmAbrams"}, {"type": "abrams", "weapon": "crotaleAbrams"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}, {"type": "amx10", "weapon": "gatlingAmx10"}], [{"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion3", "weapon": "radarMobile"}, {"type": "camion3", "weapon": "radarMobile"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "t90", "weapon": "gatlingDT90"}, {"type": "t90", "weapon": "gatlingDT90"}, {"type": "t90", "weapon": "gatlingDT90"}, {"type": "t90", "weapon": "125mmT90"}], [{"type": "t90", "weapon": "gatlingDT90"}, {"type": "t90", "weapon": "gatlingDT90"}, {"type": "t90", "weapon": "gatlingDT90"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "t90", "weapon": "125mmT90"}, {"type": "t90", "weapon": "125mmT90"}, {"type": "t90", "weapon": "125mmT90"}], [{"type": "tigre", "weapon": "crotaleTigre"}, {"type": "tigre", "weapon": "gatlingDTigre"}, {"type": "tigre", "weapon": "crotaleTigre"}, {"type": "tigre", "weapon": "gatlingDTigre"}, {"type": "tigre", "weapon": "crotaleTigre"}, {"type": "tigre", "weapon": "gatlingDTigre"}, {"type": "tigre", "weapon": "crotaleTigre"}, {"type": "tigre", "weapon": "gatlingDTigre"}], [{"type": "t90", "weapon": "gatlingDT90"}, {"type": "t90", "weapon": "gatlingDT90"}, {"type": "abrams", "weapon": "crotaleAbrams"}, {"type": "abrams", "weapon": "crotaleAbrams"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "75mmBrad"}], [{"type": "t90", "weapon": "gatlingDT90"}, {"type": "t90", "weapon": "gatlingDT90"}, {"type": "t90", "weapon": "gatlingDT90"}, {"type": "t90", "weapon": "gatlingDT90"}, {"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "camionBlinde", "weapon": "MLRS"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}], [{"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "t90", "weapon": "gatlingDT90"}, {"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "camionBlinde", "weapon": "MLRS"}, {"type": "camionBlinde", "weapon": "MLRS"}, {"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}], [{"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "t90", "weapon": "125mmT90"}, {"type": "t90", "weapon": "125mmT90"}, {"type": "t90", "weapon": "125mmT90"}, {"type": "t90", "weapon": "125mmT90"}, {"type": "t90", "weapon": "125mmT90"}, {"type": "t90", "weapon": "125mmT90"}, {"type": "t90", "weapon": "125mmT90"}, {"type": "t90", "weapon": "125mmT90"}], [{"type": "abrams", "weapon": "105mmDAbrams"}, {"type": "abrams", "weapon": "105mmDAbrams"}, {"type": "abrams", "weapon": "crotaleAbrams"}, {"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "camionBlinde", "weapon": "MLRS"}, {"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "t90", "weapon": "gatlingDT90"}], [{"type": "abrams", "weapon": "105mmAbrams"}, {"type": "abrams", "weapon": "105mmAbrams"}, {"type": "abrams", "weapon": "105mmAbrams"}, {"type": "abrams", "weapon": "105mmAbrams"}, {"type": "jeep", "weapon": "m60"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "t90", "weapon": "125mmT90"}, {"type": "t90", "weapon": "125mmT90"}, {"type": "t90", "weapon": "125mmT90"}, {"type": "t90", "weapon": "125mmT90"}], [{"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "t90", "weapon": "gatlingDT90"}, {"type": "t90", "weapon": "gatlingDT90"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "abrams", "weapon": "crotaleAbrams"}, {"type": "jeep", "weapon": "m60"}], [{"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "jeep", "weapon": "m60"}, {"type": "abrams", "weapon": "105mmDAbrams"}, {"type": "t90", "weapon": "125mmT90"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "t90", "weapon": "125mmT90"}, {"type": "t90", "weapon": "125mmT90"}], [{"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "m60Brad"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "bradley", "weapon": "75mmBrad"}, {"type": "camion2", "weapon": "null"}, {"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "camionBlinde", "weapon": "MLRS"}, {"type": "camionBlinde", "weapon": "MLRS"}, {"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "amx10", "weapon": "75mmAmx10"}, {"type": "amx10", "weapon": "75mmAmx10"}], [{"type": "t90", "weapon": "125mmT90"}, {"type": "t90", "weapon": "125mmT90"}, {"type": "camion1", "weapon": "null"}, {"type": "camion2", "weapon": "null"}, {"type": "abrams", "weapon": "crotaleAbrams"}, {"type": "abrams", "weapon": "crotaleAbrams"}, {"type": "abrams", "weapon": "crotaleAbrams"}, {"type": "abrams", "weapon": "crotaleAbrams"}], [{"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "jeep", "weapon": "null"}, {"type": "jeep", "weapon": "null"}, {"type": "jeep", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camion1", "weapon": "null"}, {"type": "camionBlinde", "weapon": "radarMobile"}, {"type": "jeep", "weapon": "null"}, {"type": "jeep", "weapon": "null"}, {"type": "jeep", "weapon": "null"}, {"type": "jeep", "weapon": "null"}, {"type": "camion2", "weapon": "null"}, {"type": "camion2", "weapon": "null"}, {"type": "camionBlinde", "weapon": "radarMobile"}], [{"type": "Yamato", "weapon": "Yamato460"}]];
const ROUTE_NAMES={"parcourt1": [{"x": "Array(_root.carte.begin._x", "y": "_root.carte.begin._y"}, {"x": "_root.carte.t1._x", "y": "_root.carte.t1._y"}, {"x": "_root.carte.t2._x", "y": "_root.carte.t2._y"}, {"x": "_root.carte.t3._x", "y": "_root.carte.t3._y"}, {"x": "_root.carte.t4._x", "y": "_root.carte.t4._y"}, {"x": "_root.carte.t5._x", "y": "_root.carte.t5._y"}, {"x": "_root.carte.t6._x", "y": "_root.carte.t6._y"}, {"x": "_root.carte.t7._x", "y": "_root.carte.t7._y"}, {"x": "_root.carte.t8._x", "y": "_root.carte.t8._y"}, {"x": "_root.carte.t9._x", "y": "_root.carte.t9._y"}, {"x": "_root.carte.t10._x", "y": "_root.carte.t10._y"}, {"x": "_root.carte.t11._x", "y": "_root.carte.t11._y"}, {"x": "_root.carte.t12._x", "y": "_root.carte.t12._y"}, {"x": "_root.carte.r1._x", "y": "_root.carte.r1._y"}, {"x": "_root.carte.r2._x", "y": "_root.carte.r2._y"}, {"x": "_root.carte.r3._x", "y": "_root.carte.r3._y"}, {"x": "_root.carte.r4._x", "y": "_root.carte.r4._y"}, {"x": "_root.carte.r5._x", "y": "_root.carte.r5._y"}, {"x": "_root.carte.r6._x", "y": "_root.carte.r6._y"}, {"x": "_root.carte.r7._x", "y": "_root.carte.r7._y"}, {"x": "_root.carte.r8._x", "y": "_root.carte.r8._y"}, {"x": "_root.carte.r9._x", "y": "_root.carte.r9._y"}, {"x": "_root.carte.r10\n   ._x", "y": "_root.carte.r10._y"}], "parcourt2": [{"x": "Array(_root.carte.g1._x", "y": "_root.carte.g1._y"}, {"x": "_root.carte.g2._x", "y": "_root.carte.g2._y"}, {"x": "_root.carte.g3._x", "y": "_root.carte.g3._y"}, {"x": "_root.carte.r1._x", "y": "_root.carte.r1._y"}, {"x": "_root.carte.r2._x", "y": "_root.carte.r2._y"}, {"x": "_root.carte.r3._x", "y": "_root.carte.r3._y"}, {"x": "_root.carte.r4._x", "y": "_root.carte.r4._y"}, {"x": "_root.carte.r5._x", "y": "_root.carte.r5._y"}, {"x": "_root.carte.r6._x", "y": "_root.carte.r6._y"}, {"x": "_root.carte.r7._x", "y": "_root.carte.r7._y"}, {"x": "_root.carte.r8._x", "y": "_root.carte.r8._y"}, {"x": "_root.carte.r9._x", "y": "_root.carte.r9._y"}, {"x": "_root.carte.r10._x", "y": "_root.carte.r10._y"}], "parcourt3": [{"x": "Array(_root.carte.begin._x", "y": "_root.carte.begin._y"}, {"x": "_root.carte.h1._x", "y": "_root.carte.h1._y"}, {"x": "_root.carte.h2._x", "y": "_root.carte.h2._y"}, {"x": "_root.carte.h3._x", "y": "_root.carte.h3._y"}, {"x": "_root.carte.h4._x", "y": "_root.carte.h4._y"}, {"x": "_root.carte.h5._x", "y": "_root.carte.h5._y"}, {"x": "_root.carte.r10._x", "y": "_root.carte.r10._y"}], "parcourt4": [{"x": "Array(_root.carte.e1._x", "y": "_root.carte.e1._y"}, {"x": "_root.carte.e2._x", "y": "_root.carte.e2._y"}, {"x": "_root.carte.e3._x", "y": "_root.carte.e3._y"}, {"x": "_root.carte.e4._x", "y": "_root.carte.e4._y"}, {"x": "_root.carte.e5._x", "y": "_root.carte.e5._y"}, {"x": "_root.carte.e6._x", "y": "_root.carte.e6._y"}, {"x": "_root.carte.e7._x", "y": "_root.carte.e7._y"}, {"x": "_root.carte.e8._x", "y": "_root.carte.e8._y"}]};

// 真实路点 (deobf/data/waypoints.json, SWF PlaceObject2 矩阵坐标)
const ROUTES = {"parcourt1": [[126.4, 579.7], [228.8, 380.7], [446.1, 188.1], [599.1, 87.0], [1105.2, 97.0], [1581.2, 175.0], [1808.5, 62.6], [1899.4, -149.1], [1743.4, -352.9], [1519.3, -328.6], [1319.3, -171.1], [1129.5, -195.3], [977.2, -403.1], [861.1, -579.2], [1081.0, -699.2], [1429.5, -636.5], [1629.8, -745.2], [1605.5, -1295.5], [1405.2, -1385.4], [903.2, -1401.4], [495.1, -1385.4], [172.9, -1377.1], [93.0, -1562.8]], "parcourt2": [[-198.0, -527.8], [7.7, -543.8], [370.8, -568.1], [861.1, -579.2], [1081.0, -699.2], [1429.5, -636.5], [1629.8, -745.2], [1605.5, -1295.5], [1405.2, -1385.4], [903.2, -1401.4], [495.1, -1385.4], [172.9, -1377.1], [93.0, -1562.8]], "parcourt3": [[126.4, 579.7], [228.8, 288.2], [1543.7, 199.3], [1719.1, -660.8], [1795.2, -1114.2], [207.0, -1169.3], [93.0, -1562.8]], "parcourt4": [[-182.6, -1110.5], [117.3, -1114.2], [268.8, -1112.4], [339.6, -927.2], [375.1, -856.8], [467.1, -983.9], [421.8, -1037.3], [-237.4, -1114.2]]};

// 每波进攻路线 (deobf/data/missions.json waves[i].route, unitsMissions 每波外层数组第二元素 — 权威)
// 旧实现 guessRoute 按规则猜 (舰→p4/直升机→p3/其余 wave%3), 与原版 16/44 波不一致
const WAVE_ROUTES=["parcourt1","parcourt1","parcourt2","parcourt1","parcourt1","parcourt1","parcourt1","parcourt2","parcourt1","parcourt1","parcourt1","parcourt1","parcourt1","parcourt2","parcourt1","parcourt1","parcourt1","parcourt3","parcourt1","parcourt1","parcourt1","parcourt1","parcourt2","parcourt1","parcourt4","parcourt3","parcourt1","parcourt1","parcourt2","parcourt1","parcourt1","parcourt3","parcourt2","parcourt1","parcourt1","parcourt2","parcourt1","parcourt1","parcourt1","parcourt1","parcourt2","parcourt1","parcourt2","parcourt4"];

// ---------------- 剧情对白 (主攻方向二, N+77) ----------------
// 权威 = deobf/scripts/frame_6/PlaceObject2_980_242 onClipEvent(load):
//   scenario[iMission] (iMission 1 基, 45 项含空占位), 每句 = [说话人码, 文本],
//   nextDialogue 逐句推进, 放完 → nextMission → startMission (953 haloNoir 时间线)。
//   简报暂停波 = 953 f30 分支 {1,5,9,11,15,16,19,26,31,37,41,44} (= BRIEFING_WAVES)。
// 文本按原关卡安排逐句改写为中文并去除政治元素 (现实国名/人名一律虚构化:
//   敌方 = "北方联盟", 我方 = "联军"; 涉领袖/政客的播报改为虚构机构与职务)。
// 说话人码: 首字母 D/G/R/S = 原版四象限站位 (右下/左下/右上/左上);
//   两字母+ v (Xv/Ev/Cv/Yv/Lv/Bv/Av/Mv/Hv) = 旁白/新闻播报 (无头像);
//   其余子串含人物名: Mick=布伦森指挥官, Elisa=伊丽莎白(其妹), Alex=格雷,
//   Andrew=副官安德鲁, Sarah=特使莎拉, Shen=沈(敌方参谋), Zhu=朱(敌方将领)。
const STORY_NAMES = [
  [/Mick/, '布伦森指挥官'], [/Elisa/, '伊丽莎白'], [/Alex/, '格雷'],
  [/Andrew/, '安德鲁'], [/Sarah/, '莎拉'], [/Shen/, '沈(敌方参谋)'], [/Zhu/, '朱(敌方将领)'],

];
const STORY = {
1: [
["Xv","这里播报一则官方声明：北方联盟要求联军全部部队与工业设施立即撤出争议边境地区。围绕能源基地铺设问题的分歧，双方紧张关系持续升级。"],
["Ev","北方联盟领导人公开指认联军条约是一场旨在遏制其经济发展的阴谋，呼吁本国侨民开始撤离。驻扎在当地的联军部队撤与不撤，看来只是时间问题。"],
["Cv","联军方面新任文职领导人表示希望尽快通过外交途径化解紧张局势，并宣布将于下周与各方展开会谈。"],
["Yv","世界早已在联军与北方联盟签署排他性商业条约时领教过对方的怒气。看来，反应不会来得太迟。"],
["Lv","※ 争议边境，联军“蓝星”基地 ※"],
["SAlexEttonement","没有比这更糟的局面了。……嗯？指挥官，你打算怎么办？"],
["DMickNeutre1","我打算怎么办？你和我听到的是同一道命令——尽快撤离基地，命令已经下达了！"],
["SAlexStoppant","不行，我们不能把这个营地留给对方。"],
["DMickAutoritaire","格雷先生，这片土地处在争议区。在另有通知之前，这里由我指挥，你只是我的“客人”。"],
["SAlexNeutre1","布伦森先生，理智一点。你知道“州长”这个头衔只是我更……隐秘活动的一层掩护。我掌握大量情报，虽然国内还没有下达指令，但我向你保证：这座基地必须守住。"],
["DMickNeutre2","……你到底什么意思？你手里是什么样的情报？"],
["SAlexSecret","现在谈还为时过早，也许根本用不上。但我发誓——给我一点时间，不要交出这座基地。"],
["GElisaEtonne","※ 走进来 ※ 米夏尔？哦，格雷先生也在。"],
["DMickNeutre1","啊，伊丽莎白，你看起来很不安。"],
["GElisaNeutre","撤离命令……我在想事情会不会变得更糟。"],
["DMickNarquois","别担心，你不会出事的。"],
["GElisaAnxieuse","对了，直升机飞行员问你，发动机能不能先点火？"],
["DMickHesitant","呃……这意味着……"],
["SAlexConvainquant","我们不撤。"],
["GElisaEtonne","什么？"],
["DMickNeutre2","我们再留一阵子，赌对方不会派车来逼我们走。"],
["GElisaIndignee","这也太蠢了！要是真来了呢？"],
["SAlexNeutre1","那就抵抗。"],
["DMickAutoritaire","亚历山大，请冷静。你的好战劲头让我提不起任何兴趣。我们先试着谈判。"],
["SAlexNeutre2","谈判你什么也得不到。命令很清楚：撤退——但我们拒绝服从。"],
["GElisaIndignee","疯了吧你们！！你们到底想挑衅什么？"],
["SAlexStoppant","我不能说太多。"],
["GElisaSupplie","米夏尔，你是这里的指挥官，不能让他做主！"],
["DMickHesitant","呃，忍一忍，妹妹。我们就再留一小会儿，看看局势怎么发展。"],
["SAlexNeutre1","啊，安德鲁，你来了。"],
["RAndrewRapport","是，州长！指挥官，对方的车辆准备强行进入营地。我们试着交涉，但他们拒绝我们留在这里，必须马上撤走。"],
["GMickAutoritaire","我们偏不撤……我们会拦下这些车辆。新来的队长到了吗？"],
["RAndrewExplicatif","到了，指挥官！我这就带他进来。你要知道，北面的主电台已经被对方控制，我在这里架了一座转信站，保持与南岸基地的联系。"],
["GMickNeutre1","干得好，安德鲁。跟新队长交代命令：他必须守住营地。只要有一辆车从北面冲过去，我们就全完了。"],
["RAndrewRapport","是，指挥官！"],
["RAndrewFace","※特写※ 啊，队长……我知道你刚到，但我得快点给你交代任务。你会看到中央指挥视图，可以从空中俯瞰整个基地；用鼠标或方向键都能移动地图。\n基地绝不能失守，否则任务失败。右侧是建造系统，用来阻止车辆抵达目标。观察草地——颜色较浅的区域就可以建造炮塔。\n对了，别忘记按空格键可以取消。\n接下来的战斗里我会继续给你提示！\n祝你好运，队长！"],
],
5: [
["DAndrewFace","队长，按 R 键可以修理选中的炮塔。此外你还可以开启“自动修理”模式，让炮塔自动修复。小心它花费不小：每次自动修理触发时，炮塔周围会出现一圈蓝色磁场。"],
],
9: [
["Yv","宣战书在国际社会激起一片恐慌。联军因拒绝撤出争议区的军事基地，成为北方联盟的主要目标。双方盟友体系随即自动成形。"],
["Bv","面对拒不离开争议领土的联军，北方联盟的盟友们组成了所谓“新自由世界”阵营，并声明对西方“只许自己拥有、不许别国掌握”的双重标准深感不满。"],
["Xv","尽管争议区至今尚未交火，这场对峙已经颇有“世界大战”的架势。人们只能希望冲突尽早和平解决。"],
["SAlexConvainquant","该来的，还是来了……"],
["DElisaColere","哦，是吗？难道你要让我们相信这一切不可避免？我们本可以直接撤走，而不是搞出这么一大堆麻烦！！"],
["RAndrewRaleur","我不想显摆，可附近还躺着 64 枚洲际导弹呢——去留随你们便……"],
["GMickNeutre1","安德鲁，这种评论我们不需要，谢谢。"],
["RAndrewExplicatif","抱歉，指挥官……嗯说到这个，我的信息组刚收到对方部队的电台通告：这是最后一次要求我们离开……老实说，我怎么回复他们？"],
["SAlexEttonement","你觉得呢？"],
["DElisaIndignee","跑路！就这么回复他们！！我总觉得自己在这里才像个入侵者！"],
["GMickAutoritaire","她说得没错……"],
["SAlexAffole","你不是真想现在撤吧？"],
["RAndrewEttone","呃，指挥官，抱歉打断——国内的特使刚刚穿过对方防线到了。我们的战机一路掩护——哦对了，那位是……啊不，是位女士……她到了。"],
["DSarahNeutreSouriante","※ 走进来 ※ 我想你就是米夏尔·布伦森？幸会，我是文职领导人的特使。"],
["SAlexNeutre1","特使？这么年轻？"],
["DSarahNeutre","什么意思？我出人头地比较早而已！\n我是来传达指令的。国内本不想公开表态，但既然你们决定留下——那我们只好承认，这对我们来说正合适。"],
["GMickNeutre2","所以我们就留下了。"],
["DSarahEmbarasse","这很糟糕……但我们留下了。那些导弹，我们不能留给对方。"],
["GElisaColere","为什么不行？那是人家的东西！有人禁止过我们拥有自己的导弹吗？"],
["DSarahSurprise","这位是……？"],
["GElisaVexe","伊丽莎白·布伦森，指挥官的妹妹。"],
["DSarahNeutre","真可爱……亲爱的，你会明白政治比这复杂一点。对了，我飞过营地上空时看到有人种了花，是你种的吗？"],
["GElisaEtonne","呃……是的。"],
["DSarahPepsodent","太棒了！"],
["RAndrewRaleur","呃，女士们，恕我扫兴——雷达上出现回波信号，看来对方没等我们回复。"],
],
11: [
["RMickFace","队长，对方换装了更重的战车。作为应对，我们建议你解锁 105mm 加农炮。"],
],
15: [
["Xv","几周来最大的新闻：多地冲突爆发，直升飞机袭击了联军多处阵地。多国政要接连表态，局势进一步走向对抗。"],
["RSarahEmbarasse","情况不妙，新的冲突很可能在更多联军影响区出现……各方纷纷宣布站队，对抗继续升级。"],
["DElisaVexe","全是“重归于好”的好消息啊……真聪明！"],
["RSarahNeutre","嗯，我不得不承认，事情越弄越糟……只有一位领导人还愿意回到谈判桌前，甚至邀请了对方议员到本国会谈。"],
["GMickNeutre1","结果呢？"],
["RSarahSurprise","结果……他们拒绝了邀请。"],
["DAndrewRapport","嗯，营地把南面出现了新的集结单位。"],
["GMickNeutre2","又来了……"],
],
16: [
["DMickFace","我们建议你解锁新型双联 105mm 加农炮。你会用得上它来对付新型的重型战车……小心，它们火力猛、装甲厚。"],
],
19: [
["QZhuRapport","我们的将士勇气可嘉，为强大的祖国增光。但还不够！敌人还在顽抗……为了荣誉，为了你我共同的家园，我们必须拿回属于我们的荣耀。"],
["PShenNeutre","……你干得很出色，林将军，这项任命我没有后悔。"],
],
26: [
["SAlexAffole","我早说过事情不该变成这样！"],
["DSarahEmbarasse","亚历山大，别激动，眼下最要紧的是挡住他们。"],
["SAlexConvainquant","对方的军舰知道我们的无线电频率，连我们的前沿警戒阵地都可能被端掉。你还高兴得起来？他们是怎么知道的？"],
["GMickNeutre1","……有内鬼？……安德鲁？"],
["RAndrewEttone","我？绝不可能，开什么玩笑！"],
["GMickNarquois","不，安德鲁，不是你，是你手下管通讯的人。毕竟频率他们最清楚……这你没什么印象吗？"],
["RAndrewExplicatif","真没有。我手下的人都和我受同样的训练，彼此知根知底，我想不出谁会泄密……也可能根本没人泄密？"],
["SAlexNeutre1","他们也许只是碰巧在合适的时机对上了频率……安德鲁，严肃点，肯定有人告诉了他们。"],
["DSarahNeutre","※低声※ 嗯，米夏尔，我得跟你谈谈。"],
["GMickNeutre2","没问题莎拉，现在谈也行。"],
["DSarahSurprise","※ discret ※ 呃，我是说……私下谈……"],
["SAlexNeutre2","坏消息。我刚接到线人电话……朱将军和主席的侄子沈明就在营地以南，他们亲自来给部队打气了。"],
["RAndrewRaleur","什么？那个疯子亲自来了？"],
["DMickNeutre1","你是说，他们就在营地以南几百米？"],
["SAlexEttonement","恐怕正是。"],
["DSarahSurprise","嗯，各位，这音乐是怎么回事？"],
],
31: [
["RAndrewExplicatif","成了！！我终于把这烦人的音乐关掉了！它是通过基地所有喇叭都接着的电台频道放出来的……我们的士兵居然没发现。对了，盟友向我们转交了新型激光技术，代号 MTHEL。"],
["SAlexNeutre1","激光？"],
["RAndrewExplicatif","对，有点像科幻电影里那种。"],
["SAlexConvainquant","妙极了。我这边的消息：友军空军上校来电，他们会派一位王牌来增援我们。"],
["Av","她的名字是埃莲娜·“天使”·波克罗夫斯卡娅，上尉，Su37“终结者”战斗机的飞行员。我们每隔一分钟就可以请求一次定点空袭，只需要标定轰炸区域。当然，炸弹只会命中敌方目标。"],
["RAndrewEttone","漂亮的战机！"],
["GSarahSurprise","※低声※ 哦米夏尔，我刚发现了一件难以置信的事……我看了你妹妹的日记……"],
["DMickNeutre1","你说什么？你经常翻别人的私人物品吗？！"],
["GSarahNeutreSouriante","呃……是的，从小改不掉的坏习惯……\n……但有时候非常有用！猜猜看，你妹妹在北方求学的时候……"],
["DMickNeutre2","怎样？"],
["GSarahSurprise","猜猜谁和她同在一间教室——沈明，主席的侄子！"],
["DMickNeutre1","你开玩笑吧？"],
["GSarahNeutre","没有。我很惊讶你居然不知道，他们当时正在交往！更糟的是，没有任何记录说他们分开了！"],
["DMickHesitant","呃，可是……不可能吧……？"],
["GSarahEmbarasse","米夏尔，从一开始伊丽莎白就反对留守；接着军舰收到了无线电频率；然后是这音乐，而沈明就在营地以南……你必须面对现实：你妹妹和敌国主席的侄子在一起，而那个人正在抓越来越多的权……这事你得给我说清楚，米夏尔！"],
],
37: [
["RSarahNeutreSouriante","哦队长，可算找到你了！你有解锁新武器的机会！如果你至今都选了完整的一轮，那这次就是“冥王”导弹——一种可以打击任意地点的弹道导弹，威力与冲击范围都相当可观……据说是盟友送的，希望它好使！"],
],
41: [
["SAlexAffole","我觉得我们撑不了多久了，对方的攻势太猛……朱将军，我见过他一次，他不会罢休的，无论损失多大。安德鲁，你说的那套著名加密——所有发射码都用上了吗？"],
["DAndrewRapport","全在我箱子里，州长！"],
],
44: [
["RAndrewEttone","警报！！我的回波雷达上有个庞然大物，我这辈子都没见过这种东西！"],
["GMickEnnerve","它从哪来的？"],
["RAndrewRaleur","呃……其实它在水上，不在陆地上……我上次见到这种东西还是在怪兽电影里，说实话，这一点也不让我安心！"],
["DSarahEmbarasse","米夏尔，让直升机把发动机点上，求你了。"],
["GMickAutoritaire","照办，这样好多了……"],
["DSarahSurprise","……你妹妹现在人在哪儿？"],
],
2: [
["RAndrewFace","菜单里有帮助专区，里面列有快捷键和敌方情报。特别是按 G 键可以放大或缩小空中侦察视图；按 S 键可以把选中的炮塔以原价 3/4 卖掉。注意：炮塔受损后转售价会降低。"]],
3: [
["RMickFace","队长，很高兴见到你……当心，对方车辆有时会从西侧小路过来，而不只走南方公路。从那边到我们营地的路程更短——记住了！"]],
4: [
["GMickNeutre1","我们这是在做什么……"],
["RAndrewRapport","指挥官，直升机飞行员再次请求撤离——发动机已经热了……人也一样！"],
["GMickNeutre2","……告诉他们，我们 3 小时后起飞。"],
["DAlexAffole","米夏尔，我求你……！我们不能丢下这个营地！"],
["GMickEnnerve","州长，是我下令击毁对方部队的，那些人什么也没做错。你明白这意味着什么吗？绝不能再往前走了！我们撤离！"],
["DAlexEttonement","……你没给我留选择的余地……"],
["GMickHesitant","你说什么，州长？"],
["DAlexSecret","我把一切都告诉你。别再叫我州长了——你知道这个头衔只是我那些活动的掩护。"],
["GMickNeutre1","我听着呢……州长……"],
["DAlexConvainquant","嗯……真相是：对方要不惜一切夺回这片区域，原因很简单——这座基地几年前秘密建成，就是为了控制 64 枚洲际导弹。我和我的人用只有我知道的新密钥锁死了发射系统……但谁也不能保证他们的工程师破不了译。"],
["GMickHesitant","……什么？"],
["RAndrewEttone","64 枚洲际导弹？！我的天！\n\n……呃，抱歉，指挥官。"],
["DAlexStoppant","麻烦在于：对方只拥有少量核武器，从不讳言，声称仅用于自卫。\n但争议区这里完全是另一回事——是 64 枚射程覆盖全球的“光耀”远程弹道导弹，这种打击能力世上没有几家有。以当前的紧张局势，我们不能把它留下。"],
["GMickNeutre2","“光耀”……如果我没记错，是“荣耀”的意思……什么样的疯子会认为手握核武器是荣耀……？"],
["DAlexEttonement","无论如何，你现在该理解我为什么反对把基地交还出去了。"],
["SElisaVexe","可这基地本来就是人家的，州长！我们不能因为觉得危险就占着别人的领土！"],
["GMickHesitant","伊丽莎白，求你了……事情没那么简单……何况留在这里可能引发更大的冲突。"],
["DAlexAffole","冲突早就埋下了，我怀疑对方无论如何都不会就此收手。"],
["GMickNeutre1","要是他们就此收手呢？那我们此举岂不是惹的麻烦比解决的多？"],
["DAlexNeutre2","你是指挥官。现在你知道的和我一样多……我没法替你决定。"],
["SElisaSupplie","米夏尔……我们又会惹出更多麻烦的……"],
["GMickAutoritaire","安德鲁，下令……"],
["RAndrewEttone","是，指挥官？"],
["GMickAutoritaire","通知飞行员关掉发动机，回到防御炮位。我们守住营地，等国内的直接命令。"],
["RAndrewRapport","是，指挥官！"],
["RAndrewFace","※特写※ 啊队长，有个坏消息：对方的武装部队正朝营地逼近。告诉你，你可以修理炮塔，每点生命 2 元。有时候这比造一座新塔贵——但每丢一座塔，你的总分都会大受影响，怎么选你自己权衡。\n\n祝你好运，队长！"]],
6: [
["SAlexFace","尽量减少损失。我们每个士兵的生命都很重要。你的分数就在那里：你所付出的代价……"]],
7: [
["SMickFace","对方装备了轻型装甲车。随着冲突升级，我们也加入了 75mm 加农炮——又快又轻，好好使用它们。"]],
8: [
["GAndrewRaleur","又来了一批……看起来这是最后一批了，至少眼下是……"]],
10: [
["DElisaSupplie","米夏尔，你可以让一切停下来。我们正在杀人，只因为不想归还别人的领土。"],
["GMickNeutre1","小妹，如果我们不这么做，死的人可能更多。"],
["DElisaAnxieuse","也可能不会！我提醒你，到目前为止只用过核武器的是我们自己！"],
["SSarahEmbarasse","伊丽莎白，我知道这很难接受，但齿轮已经转动，回不了头了。对方绝不会坐下来谈销毁导弹——那会让整个世界陷入恐惧和动荡……"]],
12: [
["SSarahNeutre","进攻的浪潮一刻不停……他们是认真的……这也难怪。＊叹气＊"]],
13: [
["GElisaIndignee","他们当然“认真”——他们是在抵抗我们的侵略！我们正在犯 21 世纪最愚蠢的错误……"]],
14: [
["SAlexSecret","你怎么看？"],
["DSarahNeutre","说实话……我也不知道该站在哪边了……"],
["RMickFace","啊，队长，我要为你完成的任务表扬你。别忘了需要的时候可以保存进度。"]],
17: [
["GSarahSurprise","奇怪，电视新闻里，沈明在对方决策层里的地位越来越重要。"],
["SMickHesitant","沈明？"],
["DElisaNeutre","联盟主席的侄子……"],
["Mv","年初，他在联盟执政党的批准下接管了武装力量的指挥权。他毕业于北方大学——是个果断、却不失温和的人。"],
["SMickNeutre1","……温和？呃，你是说……"],
["GSarahPepsodent","说说吧亲爱的，你对这位沈明的生活这么感兴趣！"],
["DElisaEtonne","哦，饶了我吧，你不就随口问了一句……"],
["SAlexNeutre1","他的左膀右臂可没那么“温和”。那位大名鼎鼎的林将军……"],
["Hv","冷酷而严苛。据说他曾处决 100 名不服“处分”的俘虏。\n去年邻邦围城战中，他三个月内打了 17 场胜仗。他的部下对他崇拜至极，在战场上个个拼命。"],
["RAndrewEttone","呃，压在我们头上的就是这位？"],
["SAlexStoppant","不，还不是。据说他还留在后方的都城。"],
["RAndrewRaleur","与此同时，我的回波雷达上又出现新部队了……这里就没安静过。"],
["SMickNarquois","安德鲁，你可真是个抱怨大王！"],
["RAndrewExplicatif","我以前是通讯工程师，不是前线雷达兵！"],
["SMickNarquois","总比当程序员强，安德鲁，你该自豪！"]],
18: [
["RAlexFace","队长，你将有机会在解锁武器和提高利率之间做选择。利率越高，钱生钱越快。但你要知道：对方的盟友派来了直升机部队助战，那些飞行员是世界上最勇猛的一批！队长，我建议你选武器。"],
["RAlexFace","它是“响尾蛇”导弹，可以对地也可以对空。目前只有机枪能打空中目标——选择时务必考虑这一点。另外，“响尾蛇”对空打击威力是四倍。"]],
20: [
["DSarahNeutreSouriante","队长，好消息！又有一项解锁机会——盟友送来了 125mm 榴弹炮。\n嗯，不过只有先解锁了前一件武器才能解锁它——这是坏消息的一面……＊尴尬＊"]],
21: [
["PShenSurpris","这样的抵抗出乎我的意料。只有格雷·亚历山大先生知道这地方的重要性……他透露了什么吗？\n……好样的，林，我们得加倍努力。但告诉你的部队：绝不准直接炮击他们的指挥部。"],
["QZhuSalut","是，长官！我完全明白，任何情况下都不能朝指挥部开火！"]],
22: [
["GSarahEmbarasse","伊丽莎白一天比一天沉默。我很担心你妹妹，米夏尔……"],
["DMickNarquois","随她去，没事的，她偶尔这样。我们都活在生死之间，这再正常不过。倒是你精力真旺盛，莎拉，我不得不说你令人印象深刻。"],
["GSarahSurprise","哦，是吗？嗯……你要让我脸红了。"]],
23: [
["SSarahEmbarasse","大国们都装作对这场冲突不感兴趣——他们在别处的战事已经焦头烂额。"],
["DAlexStoppant","那正好，这样的巨头才不会来掺和我们这边。"],
["SSarahPepsodent","不管怎样，战争就在这里进行。要是电视台能来拍就好了……真可惜，我的右侧脸很上相的。"],
["DAlexEttonement","你能想象吗莎拉，这片争议区的基地，毫无疑问是全世界最重要的地方之一——而我们就是它的主角！"],
["SSarahNeutre","你好像很高兴……亚历山大，你是个让人不安的人。"]],
24: [
["GAndrewRaleur","又一波带导弹的坦克……没完没了。我们会挺过去的。我妈说得对，我该去当程序员的……"]],
25: [
["GMickFace","队长，当心：据悉有两艘敌方巡洋舰前来增援，很快会从东南湾抵达。盟友为这场防御战拨发了专项津贴……祝好运。"]],
27: [
["GMickAutoritaire","哦，得通知队长一声：雷达车到了。有了它们，MLRS 火箭炮和“冥王”导弹才能开火。"],
["DAndrewRapport","对，我忘了说：MLRS 和“冥王”的射程都以雷达为目标指示为准。\n另外这关还会给一次武器解锁的选择，队长会满意的。"]],
28: [
["RAndrewRaleur","这音乐我关不掉！"],
["GSarahNeutreSouriante","倒是首挺好听的情歌……嗯……你妹妹刚才躲回房间去了，真奇怪……跟我说说米夏尔，你妹妹是在北方大学读的法律，对吧？"],
["DMickHesitant","呃……对，对，好几年前就毕业了……怎么了？"],
["GSarahNeutre","……嗯，没什么。"]],
29: [
["PShenNeutre","快结束了……耐心，我只差一点点耐心……"]],
30: [
["GSarahPepsodent","哦，伊丽莎白，你可算露面了……去哪儿了？我猜你一定很喜欢这首音乐吧？＊微笑＊"],
["DElisaAnxieuse","……"],
["SAlexStoppant","米夏尔！！提醒你的队长：对方重型坦克比预计来得更早——他们的实验室似乎提前完成了“猛犸”工程，那些坦克是怪物……"]],
32: [
["DMickNeutre1","※ 长谈许久 ※ 那是好几年前。那时双方关系还不僵，人员往来容易，去那边留学也不难。\n\n我调到这座基地后，就提议伊丽莎白去对方的首都留学——反正我们在哪儿都没有别的亲人。"],
["SSarahSurprise","按她日记里的说法，她大二那年认识了沈明……似乎是一见钟情。"],
["DMickHesitant","她从没跟我提过。不过那地方确实远，她过她自己的日子，什么都不跟我说……"],
["SSarahEmbarasse","问题是，你看，放放情歌是一回事，泄露雷达频率是另一回事——那麻烦大了。要是亚历山大知道了，不管她是不是你妹妹，他都会下狠手的。"],
["DMickNeutre1","正是。所以如果你能……嗯……你知道的……我会非常感激。"],
["SSarahNeutre","交给我吧米夏尔。但你我得一起行动——你妹妹倔得像头骡子，我怕她还会干出更傻的事。嗯，对了，她来了，大家都自然点。"]],
33: [
["QZhuSalut","等夺回营地，你真觉得能让那些导弹重新上线？"],
["PShenNeutre","问题不大。但我们还没准备好收复营地——对方的抵抗组织得很像样。"],
["QZhuPoing","那个倒戈将军的事怎么说？我一直纳闷，外部的人怎么帮得上我们……？"],
["PShenExplicatif","忘掉宿怨吧，林。那位将军是世界上众多暗中倒向我们这边的军官之一——一个更公平的世界，连“敌国”的人心也会动。这是个可敬的人，他很快就到。"],
["QZhuRapport","就算他可敬，他能怎么帮我们？"],
["PShenSurpris","自从那边修改宪法、军队重新获得合法地位之后，一个秘密小组就启动了著名的“大和”工程……"],
["QZhuPoing","战列舰？！他们要把一艘战列舰开过来？"],
["PShenNeutre","……前提是田中将军能做得到……"]],
34: [
["SAndrewFace","队长！队长！有个坏消息：装备 MLRS 火箭炮的卡车马上要到了。优先打掉伴随它们的雷达车——雷达一毁，MLRS 就成了瞎子！好，我知道，说比做容易……但至少我把话带到了，剩下的就看你的了！"]],
35: [
["PShenSurpris","告诉我，林将军，你确定采取的措施不会伤到她？"],
["QZhuSalut","绝对放心，我的人只接到朝防御工事开火的命令。而且任何离开基地的平民都会被客气地请走。"],
["PShenNeutre","……很好……"]],
36: [
["DAlexEttonement","你的新队长干得漂亮，米夏尔……我印象深刻。"],
["SMickNeutre2","我也是。但不幸的是我得告诉他：敌方一列新的炮兵纵队正从西侧小桥过来……他不会高兴的。"]],
38: [
["GSarahNeutre","你怕死吗，米夏尔？"],
["DMickNeutre2","我是军人……"],
["GSarahEmbarasse","我害怕……"],
["DMickNeutre1","你知道，对方的部队还没推进到防御圈。等真到那天，我们还有时间撤离……只不过到那时，导弹就归他们了……"],
["RElisaVexe","那又怎样？本来就是他们的。"],
["GSarahNeutre","嗯……伊丽莎白，求你别说了……"],
["SAlexSecret","嗯……？"],
["DMickNarquois","没什么，亚历山大，看你的报纸去。"]],
39: [
["SAlexFace","队长，我们知道局势艰难，所以额外再给你一次解锁武器的机会。要是武器已经全解锁了，那就该考虑提高利率了。"]],
40: [
["DSarahNeutre","你妹妹常常望着窗外，朝南边看……还真是有几分浪漫。"],
["GMickNeutre1","这场乱局里，你觉得“浪漫”的事还有不少？"],
["DSarahPepsodent","比如说你呀……\n\n……哦别生气，开玩笑的……"]],
42: [
["QZhuPoing","对面打得很勇敢，抵抗的劲头令人吃惊……长官，你的增援到底怎么样了？"],
["PShenNeutre","听说田中已经带着装备出港了……那边的其他将领还以为那只是一次例行演习。他很快就到。"]],
43: [
["DMickAutoritaire","莎拉，你让我认真思考过了……"],
["GSarahSurprise","呃，什么意思？我们上次单独谈话是什么时候来着？＊脸红＊"],
["DMickNeutre1","抱歉？不，不是那个意思。我是说你之前说撤退的话是对的——稳妥起见，我已经命令直升机飞行员随时待命撤离。"],
["GSarahEmbarasse","哦，抱歉……不管怎样，我们不会死在这里的，这倒是好消息……"],
["DMickNarquois","那以后有什么打算？回国，我猜？"],
["GSarahNeutre","没兴趣，想都没想过……至少现在，我的位置在这里，和你在一起。"],
["DMickHesitant","哦，呃……真动人……\n\n那么你呢，亚历山大，你同意吗？"],
["SAlexNeutre1","我们有选择吗？反正对方拿不到发射码。安德鲁又加了一层双重加密，我现在比之前安心多了——按他的说法，那套东西坚不可摧。"],
["RAndrewExplicatif","我业余时间就是搞计算机的，所以嘛……\n哦对了，不知道怎么回事，下一波进攻全是无武装的——只有吉普和卡车。"]]
};


// ---------------- 终局演出 (N+79) ----------------
// 权威 = DefineSprite_1158 frame_80 (endPass): 6 句敌台对白 + textesTempo 毫秒时间轴
//   [13300,13300,5600,4200,6200,2800] (自动推进, 总 ~45.4s); 播完 → "end"(1125) 胜局
//   336 帧动画; 败局 = activePerdu (6_329/327): 单位抵达后延迟 4s, "perdu"(1132) 30 帧动画
//   + gameOverStart 段落 (已接线), aPerdu 防重入。文本已中文去政治化。
const END_TEMPO = [13300, 13300, 5600, 4200, 6200, 2800];
const END_DLG = [
["朱(敌方将领)","报告长官，调虎离山成功了。那场自我了断没有白费——我们的炮手袭掠了他们的阵地，通路已经打开，营地已在我们的掌控之中。"],
["沈(敌方参谋)","……干得好，林将军。荣誉没有蒙尘，我们会记得他。……她呢？"],
["朱(敌方将领)","小姐安然无恙，正在营帐里休息。"],
["沈(敌方参谋)","……这么多年了，我迫不及待想再见到她。"],
["朱(敌方将领)","恕我多言，长官——小姐告诉我，她已经取回了导弹的发射密码。"],
["沈(敌方参谋)","……很好。"],
];
